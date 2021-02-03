/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SOQLParser, ParserError } from '@salesforce/soql-parser';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/generated/SoqlParserListener';
import { SoqlParserVisitor } from '@salesforce/soql-parser/lib/generated/SoqlParserVisitor';
import * as Parser from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { Messages } from '../messages/messages';
import * as Soql from '../model/model';
import * as Impl from '../model/impl';
import { CharStream, ParserRuleContext, Token } from 'antlr4ts';
import { NoViableAltException, InputMismatchException } from 'antlr4ts';
import {
  ErrorNode,
  ParseTreeListener,
  ParseTreeWalker,
  AbstractParseTreeVisitor,
  ParseTree,
  TerminalNode,
} from 'antlr4ts/tree';
import { Interval } from 'antlr4ts/misc/Interval';

export class ModelDeserializer {
  protected soqlSyntax: string;
  public constructor(soqlSyntax: string) {
    this.soqlSyntax = soqlSyntax;
  }
  public deserialize(): Soql.Query {
    let query: Soql.Query | undefined;

    const parser = SOQLParser({
      isApex: true,
      isMultiCurrencyEnabled: true,
      apiVersion: 50.0,
    });
    const result = parser.parseQuery(this.soqlSyntax);
    const parseTree = result.getParseTree();
    const errors = result.getParserErrors();
    if (parseTree) {
      const queryListener = new QueryListener();
      parseTree.enterRule(queryListener as ParseTreeListener);
      query = queryListener.getQuery();
    }

    const errorIdentifer = new ErrorIdentifier(parseTree);
    const modelErrors = errors.map((error) => errorIdentifer.identifyError(error));
    if (query) {
      query.errors = modelErrors;
    } else {
      throw Error(JSON.stringify(modelErrors));
    }
    return query;
  }
}

interface KnownError {
  type: Soql.ErrorType;
  message: string;
  predicate: (error: ParserError, context?: ParseTree) => boolean;
}


class ErrorIdentifier {
  protected parseTree: ParseTree;
  protected nodesWithExceptionsAndErrorNodes: ParseTree[];
  protected knownErrors: KnownError[] = [
    {
      type: Soql.ErrorType.EMPTY,
      message: Messages.error_empty,
      predicate: (error) => (
        this.parseTree instanceof ParserRuleContext
        && this.parseTree.start.type === Token.EOF
      )
    },
    {
      type: Soql.ErrorType.NOSELECT,
      message: Messages.error_noSelect,
      predicate: (error, context) => (
        context instanceof Parser.SoqlSelectClauseContext &&
        context.exception instanceof InputMismatchException &&
        !this.hasNonErrorChildren(context)
      )
    },
    {
      type: Soql.ErrorType.NOSELECTIONS,
      message: Messages.error_noSelections,
      predicate: (error, context) => (
        context instanceof Parser.SoqlSelectClauseContext &&
        context.exception instanceof NoViableAltException &&
        !this.hasNonErrorChildren(context)
      )
    },
    {
      type: Soql.ErrorType.NOFROM,
      message: Messages.error_noFrom,
      predicate: (error, context) => (
        context instanceof Parser.SoqlFromClauseContext &&
        context.exception instanceof InputMismatchException &&
        !this.hasNonErrorChildren(context)
      )
    },
    {
      type: Soql.ErrorType.INCOMPLETEFROM,
      message: Messages.error_incompleteFrom,
      predicate: (error, context) => (
        context instanceof Parser.SoqlIdentifierContext &&
        context.parent instanceof Parser.SoqlFromExprContext &&
        context.exception instanceof InputMismatchException
      )
    },
    {
      type: Soql.ErrorType.INCOMPLETELIMIT,
      message: Messages.error_incompleteLimit,
      predicate: (error, context) => (
        context instanceof Parser.SoqlIntegerValueContext &&
        this.hasAncestorOfType(context, Parser.SoqlLimitClauseContext)
      )
    },
    {
      type: Soql.ErrorType.EMPTYWHERE,
      message: Messages.error_emptyWhere,
      predicate: (error, context) => (
        context instanceof Parser.SoqlWhereExprsContext &&
        context.childCount === 0
      )
    },
    {
      type: Soql.ErrorType.INCOMPLETENESTEDCONDITION,
      message: Messages.error_incompleteNestedCondition,
      predicate: (error, context) => (
        context instanceof ErrorNode &&
        context.parent instanceof Parser.NestedWhereExprContext
      )
    },
    {
      type: Soql.ErrorType.INCOMPLETEANDORCONDITION,
      message: Messages.error_incompleteAndOrCondition,
      predicate: (error, context) => (
        // trailing AND/OR
        context instanceof Parser.SoqlWhereExprContext &&
        (context.parent instanceof Parser.SoqlAndWhereContext || context.parent instanceof Parser.SoqlOrWhereContext) &&
        !this.hasNonErrorChildren(context)
      ) || (
          // leading AND/OR
          context instanceof ErrorNode &&
          context.parent instanceof Parser.SoqlWhereAndOrExprContext &&
          context.parent.childCount <= 2
        )
    },
    {
      type: Soql.ErrorType.INCOMPLETENOTCONDITION,
      message: Messages.error_incompleteNotCondition,
      predicate: (error, context) => (
        context instanceof Parser.SoqlWhereExprContext &&
        context.parent instanceof Parser.SoqlWhereNotExprContext &&
        !this.hasNonErrorChildren(context)
      )
    },
    {
      type: Soql.ErrorType.UNRECOGNIZEDCOMPAREVALUE,
      message: Messages.error_unrecognizedCompareValue,
      predicate: (error, context) => (
        context instanceof Parser.SoqlLiteralValueContext &&
        context.parent instanceof Parser.SimpleWhereExprContext &&
        context.exception instanceof NoViableAltException
      )
    },
    {
      type: Soql.ErrorType.UNRECOGNIZEDCOMPAREOPERATOR,
      message: Messages.error_unrecognizedCompareOperator,
      predicate: (error, context) => (
        context instanceof Parser.SoqlWhereExprContext &&
        context.childCount >= 2 &&
        context.getChild(1) instanceof ErrorNode &&
        (context.getChild(1) as ErrorNode).symbol === error.getToken()
      )
    },
    {
      type: Soql.ErrorType.UNRECOGNIZEDCOMPAREFIELD,
      message: Messages.error_unrecognizedCompareField,
      predicate: (error, context) => (
        context instanceof Parser.SoqlWhereExprsContext &&
        context.childCount >= 1 &&
        context.getChild(0) instanceof ErrorNode &&
        (context.getChild(0) as ErrorNode).symbol === error.getToken()
      )
    },
    {
      type: Soql.ErrorType.NOCOMPAREVALUE,
      message: Messages.error_noCompareValue,
      predicate: (error, context) => (
        context instanceof Parser.SoqlLiteralValueContext &&
        context.childCount === 0 &&
        context.parent instanceof Parser.SimpleWhereExprContext &&
        context.exception instanceof InputMismatchException
      )
    },
    {
      type: Soql.ErrorType.NOCOMPAREOPERATOR,
      message: Messages.error_noCompareOperator,
      predicate: (error, context) => (
        context instanceof Parser.SoqlWhereExprContext &&
        context.childCount === 1 &&
        context.getChild(0) instanceof ErrorNode &&
        (context.getChild(0) as ErrorNode).symbol !== error.getToken()
      )
    }
  ]

  constructor(parseTree: ParseTree) {
    this.parseTree = parseTree;
    this.nodesWithExceptionsAndErrorNodes = [];
    this.findExceptionsAndErrorNodes(parseTree);
  }

  public identifyError(error: ParserError): Soql.ModelError {
    const context = this.matchErrorToContext(error);
    const knownErrorMatch = this.knownErrors.find(knownError => knownError.predicate(error, context));

    return knownErrorMatch
      ? {
        type: knownErrorMatch.type,
        message: knownErrorMatch.message,
        lineNumber: error.getLineNumber(),
        charInLine: error.getCharacterPositionInLine()
      }
      : {
        type: Soql.ErrorType.UNKNOWN,
        message: error.getMessage(),
        lineNumber: error.getLineNumber(),
        charInLine: error.getCharacterPositionInLine()
      };
  }

  protected findExceptionsAndErrorNodes(context: ParseTree): void {
    if (context instanceof ParserRuleContext && context.exception) {
      this.nodesWithExceptionsAndErrorNodes.push(context);
    }
    if (context instanceof ErrorNode) {
      this.nodesWithExceptionsAndErrorNodes.push(context);
    }
    if (context.childCount > 0) {
      for (let i = 0; i < context.childCount; i++) {
        const child = context.getChild(i);
        this.findExceptionsAndErrorNodes(child);
      }
    }
  }

  protected getGrammarRule(error: ParserError): string | undefined {
    const context = this.matchErrorToContext(error);
    if (context) {
      return context.constructor.name;
    }
    return undefined;
  }

  protected matchErrorToContext(error: ParserError): ParseTree | undefined {
    for (let i = 0; i < this.nodesWithExceptionsAndErrorNodes.length; i++) {
      const node = this.nodesWithExceptionsAndErrorNodes[i];
      if (node instanceof ParserRuleContext &&
        node.exception?.getOffendingToken() === error.getToken()) {
        return node;
      }
      // ErrorNode matches if location matches (or if location is off by one character when the error is on <EOF>)
      if (node instanceof ErrorNode
        && node.symbol.line === error.getLineNumber()
        && (node.symbol.charPositionInLine === error.getCharacterPositionInLine()
          || (node.symbol.charPositionInLine === error.getCharacterPositionInLine() - 1
            && error.getToken()?.type === Token.EOF))) {
        return node;
      }
    }
    return undefined;
  }

  protected hasNonErrorChildren(context: ParserRuleContext): boolean {
    if (context.childCount > 0) {
      for (let i = 0; i < context.childCount; i++) {
        const child = context.getChild(i);
        if (!(child instanceof ErrorNode)) {
          return true;
        }
      }
    }
    return false;
  }

  protected hasAncestorOfType(context: ParserRuleContext, type: any): boolean {
    if (context instanceof type) {
      return true;
    }
    if (context.parent) {
      return this.hasAncestorOfType(context.parent, type);
    }
    return false;
  }
}

/**
// If we want to use a proper Visitor:
class QueryVisitor
  extends AbstractParseTreeVisitor<void>
  implements SoqlParserVisitor<void> {
  protected defaultResult(): void {}
  visitSoqlFromExpr(ctx: Parser.SoqlFromExprContext): void {}
}
*/
class QueryListener implements SoqlParserListener {
  public query?: Soql.Query;
  public select?: Soql.Select;
  public selectExpressions: Soql.SelectExpression[] = [];
  public from?: Soql.From;
  public where?: Soql.Where;
  public with?: Soql.With;
  public groupBy?: Soql.GroupBy;
  public orderBy?: Soql.OrderBy;
  public orderByExpressions: Soql.OrderByExpression[] = [];
  public limit?: Soql.Limit;
  public offset?: Soql.Offset;
  public bind?: Soql.Bind;
  public recordTrackingType?: Soql.RecordTrackingType;
  public update?: Soql.Update;

  public enterSoqlFromExpr(ctx: Parser.SoqlFromExprContext): void {
    const idContexts = ctx.getRuleContexts(Parser.SoqlIdentifierContext);
    const hasAsClause = idContexts.length > 1;
    const sobjectName = idContexts[0].text;
    let as: Soql.UnmodeledSyntax | undefined;
    if (hasAsClause) {
      const safeAS = ctx.AS();
      as =
        safeAS !== undefined
          ? this.toUnmodeledSyntax(safeAS.symbol, idContexts[1].stop as Token, 'unmodeled:as')
          : this.toUnmodeledSyntax(idContexts[1].start, idContexts[1].stop as Token, 'unmodeled:as');
    }

    const safeUSING = ctx.soqlUsingClause();
    const using = safeUSING
      ? this.toUnmodeledSyntax(safeUSING.start as Token, safeUSING.stop as Token, 'unmodeled:using')
      : undefined;
    this.from = new Impl.FromImpl(sobjectName, as, using);
  }

  // @Override
  public enterSoqlFromExprs(ctx: Parser.SoqlFromExprsContext): void {
    const fromExprContexts = ctx.getRuleContexts(Parser.SoqlFromExprContext);
    if (fromExprContexts && fromExprContexts.length === 1) {
      const fromCtx = fromExprContexts[0];
      fromCtx.enterRule(this);
    }
  }

  public enterSoqlFromClause(ctx: Parser.SoqlFromClauseContext): void {
    if (ctx.tryGetRuleContext(0, Parser.SoqlFromExprsContext)) {
      ctx.soqlFromExprs().enterRule(this);
    }
  }

  public enterSoqlSelectExprs(ctx: Parser.SoqlSelectExprsContext): void {
    const exprContexts = ctx.getRuleContexts(Parser.SoqlSelectExprContext);
    exprContexts.forEach((exprContext) => {
      // normally we would want to exprContext.enterRule(this) and delegate to
      // other functions but the antr4-tool's typescript definitions are not
      // perfect for listeners; workaround by type-checking
      if (exprContext instanceof Parser.SoqlSelectColumnExprContext) {
        const fieldCtx = (exprContext as Parser.SoqlSelectColumnExprContext).soqlField();
        const field = this.toField(fieldCtx);
        if (field instanceof Impl.UnmodeledSyntaxImpl) {
          this.selectExpressions.push(
            this.toUnmodeledSyntax(exprContext.start, exprContext.stop as Token, field.reason)
          );
        } else {
          let alias: Soql.UnmodeledSyntax | undefined;
          const aliasCtx = (exprContext as Parser.SoqlSelectColumnExprContext).soqlAlias();
          if (aliasCtx) {
            alias = this.toUnmodeledSyntax(aliasCtx.start, aliasCtx.stop as Token, 'unmodeled:alias');
          }
          this.selectExpressions.push(new Impl.FieldSelectionImpl(field, alias));
        }
      } else {
        // not a modeled case
        const reason =
          exprContext instanceof Parser.SoqlSelectInnerQueryExprContext
            ? 'unmodeled:semi-join'
            : exprContext instanceof Parser.SoqlSelectTypeofExprContext
              ? 'unmodeled:type-of'
              : exprContext instanceof Parser.SoqlSelectDistanceExprContext
                ? 'unmodeled:distance'
                : 'unmodeled:select';
        this.selectExpressions.push(
          this.toUnmodeledSyntax(exprContext.start, exprContext.stop as Token, reason)
        );
      }
    });
  }

  public enterSoqlLimitClause(ctx: Parser.SoqlLimitClauseContext): void {
    let value = undefined;
    if (ctx.soqlIntegerValue()) {
      const valueString = ctx.soqlIntegerValue().text;
      value = parseInt(valueString);
    }
    if (typeof value === 'number' && value !== NaN) {
      this.limit = new Impl.LimitImpl(value);
    }
  }

  public enterSoqlOrderByClause(ctx: Parser.SoqlOrderByClauseContext): void {
    ctx.soqlOrderByClauseExprs().enterRule(this);
    this.orderBy = new Impl.OrderByImpl(this.orderByExpressions);
  }

  public enterSoqlOrderByClauseExprs(ctx: Parser.SoqlOrderByClauseExprsContext): void {
    const exprContexts = ctx.getRuleContexts(Parser.SoqlOrderByClauseExprContext);
    exprContexts.forEach((exprContext) => {
      if (exprContext instanceof Parser.SoqlOrderByClauseExprContext) {
        const obCtx = exprContext as Parser.SoqlOrderByClauseExprContext;
        const fieldCtx = obCtx.soqlOrderByClauseField();
        const field = this.toOrderByField(fieldCtx);
        const order = obCtx.ASC()
          ? Soql.Order.Ascending
          : obCtx.DESC()
            ? Soql.Order.Descending
            : undefined;
        const nullsOrder = obCtx.FIRST()
          ? Soql.NullsOrder.First
          : obCtx.LAST()
            ? Soql.NullsOrder.Last
            : undefined;
        this.orderByExpressions.push(new Impl.OrderByExpressionImpl(field, order, nullsOrder));
      }
    });
  }

  public enterSoqlWhereClauseMethod(ctx: Parser.SoqlWhereClauseMethodContext): void {
    this.where = new Impl.WhereImpl(this.exprsToCondition(ctx.soqlWhereExprs()));
  }

  public enterSoqlInnerQuery(ctx: Parser.SoqlInnerQueryContext): void {
    const selectCtx = ctx.soqlSelectClause();
    if (selectCtx) {
      // normally we would want to selectCtx.enterRule(this) and delegate to
      // other functions but the antr4-tool's typescript definitions are not
      // perfect for listeners; workaround by type-checking
      if (selectCtx instanceof Parser.SoqlSelectExprsClauseContext) {
        (selectCtx as Parser.SoqlSelectExprsClauseContext).soqlSelectExprs().enterRule(this);
        this.select = new Impl.SelectExprsImpl(this.selectExpressions);
      } else if (selectCtx instanceof Parser.SoqlSelectCountClauseContext) {
        // not a modeled case
        this.select = this.toUnmodeledSyntax(selectCtx.start, selectCtx.stop as Token, 'unmodeled:count');
      } else {
        // no selections
        this.select = new Impl.SelectExprsImpl([]);
      }
    }
    const fromCtx = ctx.soqlFromClause();
    if (fromCtx) {
      fromCtx.enterRule(this);
    }

    const whereCtx = ctx.soqlWhereClause();
    if (whereCtx) {
      whereCtx.enterRule(this as ParseTreeListener);
    }
    const withCtx = ctx.soqlWithClause();
    if (withCtx) {
      this.with = this.toUnmodeledSyntax(withCtx.start, withCtx.stop as Token, 'unmodeled:with');
    }
    const groupByCtx = ctx.soqlGroupByClause();
    if (groupByCtx) {
      this.groupBy = this.toUnmodeledSyntax(groupByCtx.start, groupByCtx.stop as Token, 'unmodeled:group-by');
    }
    const orderByCtx = ctx.soqlOrderByClause();
    if (orderByCtx) {
      orderByCtx.enterRule(this);
    }
    const limitCtx = ctx.soqlLimitClause();
    if (limitCtx) {
      limitCtx.enterRule(this);
    }
    const offsetCtx = ctx.soqlOffsetClause();
    if (offsetCtx) {
      this.offset = this.toUnmodeledSyntax(offsetCtx.start, offsetCtx.stop as Token, 'unmodeled:offset');
    }
    const bindCtx = ctx.soqlBindClause();
    if (bindCtx) {
      this.bind = this.toUnmodeledSyntax(bindCtx.start, bindCtx.stop as Token, 'unmodeled:bind');
    }
    const recordTrackingTypeCtx = ctx.soqlRecordTrackingType();
    if (recordTrackingTypeCtx) {
      this.recordTrackingType = this.toUnmodeledSyntax(
        recordTrackingTypeCtx.start,
        recordTrackingTypeCtx.stop as Token,
        'unmodeled:record-tracking'
      );
    }
    const updateCtx = ctx.soqlUpdateStatsClause();
    if (updateCtx) {
      this.update = this.toUnmodeledSyntax(updateCtx.start, updateCtx.stop as Token, 'unmodeled:update');
    }
  }

  public enterSoqlQuery(ctx: Parser.SoqlQueryContext): void {
    const innerCtx = ctx.soqlInnerQuery();
    innerCtx.enterRule(this);
    this.query = new Impl.QueryImpl(
      this.select,
      this.from,
      this.where,
      this.with,
      this.groupBy,
      this.orderBy,
      this.limit,
      this.offset,
      this.bind,
      this.recordTrackingType,
      this.update
    );
  }

  public getQuery(): Soql.Query | undefined {
    return this.query;
  }

  public toUnmodeledSyntax(start: Token, stop: Token, reason: string): Soql.UnmodeledSyntax {
    if (!stop && start) {
      // some error states can cause this situation
      stop = start;
    }
    if (stop.stopIndex < start.startIndex) {
      // EOF token can cause this situation
      return new Impl.UnmodeledSyntaxImpl('', reason);
    }

    const text = (start.inputStream as CharStream).getText(
      Interval.of(start.startIndex, stop.stopIndex)
    );
    return new Impl.UnmodeledSyntaxImpl(text, reason);
  }

  protected toOrderByField(ctx: Parser.SoqlOrderByClauseFieldContext): Soql.Field {
    let result: Soql.Field;
    if (ctx instanceof Parser.SoqlOrderByColumnExprContext) {
      const fieldCtx = (ctx as Parser.SoqlOrderByColumnExprContext).soqlField();
      result = this.toField(fieldCtx);
    } else {
      result = this.toUnmodeledSyntax(ctx.start, ctx.stop as Token, 'unmodeled:distance');
    }

    return result;
  }

  protected toField(ctx: Parser.SoqlFieldContext): Soql.Field {
    let result: Soql.Field;
    const isFunctionRef = ctx.text.includes('(');
    if (isFunctionRef) {
      result = this.toUnmodeledSyntax(ctx.start, ctx.stop as Token, 'unmodeled:function-reference');
    } else {
      result = new Impl.FieldRefImpl(ctx.text);
    }
    return result;
  }

  protected toCompareOperator(
    ctx: Parser.SoqlComparisonOperatorContext
  ): Soql.CompareOperator {
    let operator = Soql.CompareOperator.EQ;
    switch (ctx.text) {
      case '=': {
        operator = Soql.CompareOperator.EQ;
        break;
      }
      case '!=': {
        operator = Soql.CompareOperator.NOT_EQ;
        break;
      }
      case '<>': {
        operator = Soql.CompareOperator.ALT_NOT_EQ;
        break;
      }
      case '>': {
        operator = Soql.CompareOperator.GT;
        break;
      }
      case '<': {
        operator = Soql.CompareOperator.LT;
        break;
      }
      case '>=': {
        operator = Soql.CompareOperator.GT_EQ;
        break;
      }
      case '<=': {
        operator = Soql.CompareOperator.LT_EQ;
        break;
      }
    }
    return operator;
  }

  protected toCompareValues(ctx: ParserRuleContext): Soql.CompareValue[] {
    const literalCtxs = ctx.getRuleContexts(Parser.SoqlLiteralValueContext);
    return literalCtxs.map((literalCtx) => this.toCompareValue(literalCtx));
  }

  protected toCompareValue(ctx: ParserRuleContext): Soql.CompareValue {
    if (ctx instanceof Parser.SoqlColonExprLiteralValueContext) {
      return this.toUnmodeledSyntax(ctx.start, ctx.stop as Token, 'unmodeled:colon-expression');
    } else if (ctx instanceof Parser.SoqlColonLikeValueContext) {
      return this.toUnmodeledSyntax(ctx.start, ctx.stop as Token, 'unmodeled:colon-expression');
    }
    return this.toLiteral(ctx);
  }

  protected toLiteral(ctx: ParserRuleContext): Soql.Literal {
    if (ctx instanceof Parser.SoqlLiteralLiteralValueContext) {
      ctx = ctx.soqlLiteral();
    }
    if (ctx instanceof Parser.SoqlLiteralCommonLiteralsContext) {
      ctx = ctx.soqlCommonLiterals();
    }
    if (ctx instanceof Parser.SoqlDateLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Date, ctx.text);
    } else if (ctx instanceof Parser.SoqlDateTimeLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Date, ctx.text);
    } else if (ctx instanceof Parser.SoqlTimeLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Date, ctx.text);
    } else if (ctx instanceof Parser.SoqlDateFormulaLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Date, ctx.text);
    } else if (ctx instanceof Parser.SoqlNumberLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Number, ctx.text);
    } else if (ctx instanceof Parser.SoqlNullLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Null, ctx.text);
    } else if (ctx instanceof Parser.SoqlBooleanLiteralContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Boolean, ctx.text);
    } else if (ctx instanceof Parser.SoqlMultiCurrencyContext) {
      return new Impl.LiteralImpl(Soql.LiteralType.Currency, ctx.text);
    }
    return new Impl.LiteralImpl(Soql.LiteralType.String, ctx.text);
  }

  protected exprsToCondition(ctx: Parser.SoqlWhereExprsContext): Soql.Condition {
    let condition: Soql.Condition;
    if (ctx instanceof Parser.SoqlWhereAndOrExprContext) {
      const andOrExprCtx = ctx as Parser.SoqlWhereAndOrExprContext;
      const left = this.exprToCondition(andOrExprCtx.soqlWhereExpr());
      let andOr: Soql.AndOr;
      let right: Soql.Condition | undefined = undefined;
      const andCtx = andOrExprCtx.soqlAndWhere();
      const orCtx = andOrExprCtx.soqlOrWhere();
      if (andCtx) {
        andOr = Soql.AndOr.And;
        const andExprs = andCtx.getRuleContexts(Parser.SoqlWhereExprContext);
        const conds = andExprs.map((expr) => this.exprToCondition(expr));
        while (conds.length > 0) {
          const next = conds.pop();
          if (next) {
            if (right) {
              right = new Impl.AndOrConditionImpl(next, andOr, right);
            } else {
              right = next;
            }
          }
        }
        if (right) {
          condition = new Impl.AndOrConditionImpl(left, andOr, right);
        } else {
          condition = left;
        }
      } else if (orCtx) {
        andOr = Soql.AndOr.Or;
        const orExprs = orCtx.getRuleContexts(Parser.SoqlWhereExprContext);
        const conds = orExprs.map((expr) => this.exprToCondition(expr));
        while (conds.length > 0) {
          const next = conds.pop();
          if (next) {
            if (right) {
              right = new Impl.AndOrConditionImpl(next, andOr, right);
            } else {
              right = next;
            }
          }
        }
        if (right) {
          condition = new Impl.AndOrConditionImpl(left, andOr, right);
        } else {
          condition = left;
        }
      } else {
        condition = left;
      }
    } else if (ctx instanceof Parser.SoqlWhereNotExprContext) {
      condition = new Impl.NotConditionImpl(
        this.exprToCondition((ctx as Parser.SoqlWhereNotExprContext).soqlWhereExpr())
      );
    } else {
      // empty clause
      condition = new Impl.UnmodeledSyntaxImpl('', 'unmodeled:empty-condition');
    }
    return condition;
  }

  protected exprToCondition(ctx: Parser.SoqlWhereExprContext): Soql.Condition {
    let reason = 'unmodeled:empty-condition';
    if (ctx instanceof Parser.NestedWhereExprContext) {
      const nested = this.exprsToCondition(ctx.soqlWhereExprs());
      return new Impl.NestedConditionImpl(nested);
    } else if (ctx instanceof Parser.SimpleWhereExprContext) {
      const field = this.toField(ctx.soqlField());
      const operator = this.toCompareOperator(ctx.soqlComparisonOperator());
      const value = this.toCompareValue(ctx.soqlLiteralValue());
      return new Impl.FieldCompareConditionImpl(field, operator, value);
    } else if (ctx instanceof Parser.LikeWhereExprContext) {
      const field = this.toField(ctx.soqlField());
      const value = this.toCompareValue(ctx.soqlLikeValue());
      return new Impl.LikeConditionImpl(field, value);
    } else if (ctx instanceof Parser.IncludesWhereExprContext) {
      // UNCOMMENT WHEN INCLUDES CONDITIONS ARE SUPPORTED;
      // FOR NOW FALL THROUGH TO UnmodeledSyntax
      // const field = this.toField(ctx.soqlField());
      // const opCtx = ctx.soqlIncludesOperator();
      // const operator = opCtx.EXCLUDES()
      //   ? Soql.IncludesOperator.Excludes
      //   : Soql.IncludesOperator.Includes;
      // const values = this.toCompareValues(ctx.soqlLiteralValues());
      // return new Impl.IncludesConditionImpl(field, operator, values);
      reason = 'unmodeled:includes-condition';
    } else if (ctx instanceof Parser.InWhereExprContext) {
      // UNCOMMENT WHEN INCLUDES CONDITIONS ARE SUPPORTED;
      // FOR NOW FALL THROUGH TO UnmodeledSyntax
      // const field = this.toField(ctx.soqlField());
      // const opCtx = ctx.soqlInOperator();
      // const operator = opCtx.NOT()
      //   ? Soql.InOperator.NotIn
      //   : Soql.InOperator.In;
      // const values = this.toCompareValues(ctx.soqlLiteralValues());
      // return new Impl.InListConditionImpl(field, operator, values);
      reason = 'unmodeled:in-list-condition';
    } else if (ctx instanceof Parser.CalculatedWhereExprContext) {
      reason = 'unmodeled:calculated-condition';
    } else if (ctx instanceof Parser.DistanceWhereExprContext) {
      reason = 'unmodeled:distance-condition';
    } else if (ctx instanceof Parser.InWhereExprForColonExprContext) {
      reason = 'unmodeled:in-colon-expression-condition';
    } else if (ctx instanceof Parser.InWhereExprWithSemiJoinContext) {
      reason = 'unmodeled:in-semi-join-condition';
    }
    return this.toUnmodeledSyntax(ctx.start, ctx.stop as Token, reason);
  }
}
