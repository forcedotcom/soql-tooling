/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SOQLParser, ParserError } from '@salesforce/soql-parser';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/SoqlParserListener';
import * as Parser from '@salesforce/soql-parser/lib/SoqlParser';
import { Messages } from '../messages/messages';
import * as Soql from '../model/model';
import * as Impl from '../model/impl';
import { ParserRuleContext, Token } from 'antlr4';
import { ErrorNodeImpl } from 'antlr4/tree/Tree';
import { NoViableAltException } from 'antlr4/error/Errors';


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
      parseTree.enterRule(queryListener);
      query = queryListener.getQuery();
    }

    const errorIdentifer = new ErrorIdentifier(parseTree);
    const modelErrors = errors.map(error => errorIdentifer.identifyError(error));
    if (query) {
      query.errors = modelErrors;
    } else {
      throw Error(JSON.stringify(modelErrors));
    }
    return query;
  }
}

class ErrorIdentifier {
  protected parseTree: ParserRuleContext;
  protected nodesWithExceptions: ParserRuleContext[];
  constructor(parseTree: ParserRuleContext) {
    this.parseTree = parseTree;
    this.nodesWithExceptions = [];
    this.findExceptions(parseTree);
  }

  public identifyError(error: ParserError): Soql.ModelError {
    if (this.isNoSelectionsError(error)) {
      return {
        type: Soql.ErrorType.NOSELECTIONS,
        message: Messages.error_noSelections,
        lineNumber: error.getLineNumber(),
        charInLine: error.getCharacterPositionInLine()
      };
    }
    return {
      type: Soql.ErrorType.UNKNOWN,
      message: error.getMessage(),
      lineNumber: error.getLineNumber(),
      charInLine: error.getCharacterPositionInLine()
    }
  }

  protected isNoSelectionsError(error: ParserError): boolean {
    const context = this.matchErrorToContext(error);
    return context instanceof Parser.SoqlSelectClauseContext
      && context.exception instanceof NoViableAltException
      && !this.hasNonErrorChildren(context);
  }

  protected findExceptions(context: ParserRuleContext): void {
    if (context.exception) {
      this.nodesWithExceptions.push(context);
    }
    if (context.getChildCount() > 0) {
      for (let i = 0; i < context.getChildCount(); i++) {
        const child = context.getChild(i);
        if (child instanceof ParserRuleContext) {
          this.findExceptions(child as ParserRuleContext);
        }
      }
    }
  }

  protected matchErrorToContext(error: ParserError): ParserRuleContext | undefined {
    for (let i = 0; i < this.nodesWithExceptions.length; i++) {
      const node = this.nodesWithExceptions[i];
      if (node.exception.offendingToken === error.getToken()) {
        return node;
      }
    }
    return undefined;
  }

  protected hasNonErrorChildren(context: ParserRuleContext): boolean {
    if (context.getChildCount() > 0) {
      for (let i = 0; i < context.getChildCount(); i++) {
        const child = context.getChild(i);
        if (!(child instanceof ErrorNodeImpl)) {
          return true;
        }
      }
    }
    return false
  }
}

class QueryListener extends SoqlParserListener {
  public query?: Soql.Query;
  public select?: Soql.Select;
  public selectExpressions: Soql.SelectExpression[] = [];
  public from?: Soql.From;
  public where?: Soql.Where;
  public with?: Soql.With;
  public groupBy?: Soql.GroupBy;
  public orderBy?: Soql.OrderBy;
  public limit?: Soql.Limit;
  public offset?: Soql.Offset;
  public bind?: Soql.Bind;
  public recordTrackingType?: Soql.RecordTrackingType;
  public update?: Soql.Update;

  public enterSoqlFromExpr(ctx: Parser.SoqlFromExprContext): void {
    const idContexts = ctx.getTypedRuleContexts(Parser.SoqlIdentifierContext);
    const hasAsClause = idContexts.length > 1;
    const sobjectName = idContexts[0].getText();
    let as: Soql.UnmodeledSyntax | undefined;
    if (hasAsClause) {
      as = ctx.AS()
        ? this.toUnmodeledSyntax(ctx.AS().getSymbol(), idContexts[1].stop)
        : this.toUnmodeledSyntax(idContexts[1].start, idContexts[1].stop);
    }
    const using = ctx.soqlUsingClause()
      ? this.toUnmodeledSyntax(
        ctx.soqlUsingClause().start,
        ctx.soqlUsingClause().stop
      )
      : undefined;
    this.from = new Impl.FromImpl(sobjectName, as, using);
  }

  public enterSoqlFromExprs(ctx: Parser.SoqlFromExprsContext): void {
    const fromExprContexts = ctx.getTypedRuleContexts(
      Parser.SoqlFromExprContext
    );
    if (!fromExprContexts || fromExprContexts.length !== 1) {
      throw Error('FROM clause is incorrectly specified');
    }
    const fromCtx = fromExprContexts[0];
    fromCtx.enterRule(this);
  }

  public enterSoqlFromClause(ctx: Parser.SoqlFromClauseContext): void {
    if (ctx.soqlFromExprs()) {
      ctx.soqlFromExprs().enterRule(this);
    }
  }

  public enterSoqlSelectExprs(ctx: Parser.SoqlSelectExprsContext): void {
    const exprContexts = ctx.getTypedRuleContexts(Parser.SoqlSelectExprContext);
    exprContexts.forEach((exprContext) => {
      // normally we would want to exprContext.enterRule(this) and delegate to
      // other functions but the antr4-tool's typescript definitions are not
      // perfect for listeners; workaround by type-checking
      if (exprContext instanceof Parser.SoqlSelectColumnExprContext) {
        const fieldCtx = (exprContext as Parser.SoqlSelectColumnExprContext).soqlField();
        // determine wherther field is a function reference based on presence of parentheses
        const isFunctionRef = fieldCtx.getText().includes('(');
        if (isFunctionRef) {
          this.selectExpressions.push(
            this.toUnmodeledSyntax(exprContext.stop, exprContext.stop)
          );
        } else {
          const fieldName = fieldCtx.getText();
          let alias: Soql.UnmodeledSyntax | undefined;
          const aliasCtx = (exprContext as Parser.SoqlSelectColumnExprContext).soqlAlias();
          if (aliasCtx) {
            alias = this.toUnmodeledSyntax(aliasCtx.start, aliasCtx.stop);
          }
          this.selectExpressions.push(new Impl.FieldRefImpl(fieldName, alias));
        }
      } else {
        // not a modeled case
        this.selectExpressions.push(
          this.toUnmodeledSyntax(exprContext.start, exprContext.stop)
        );
      }
    });
  }

  public enterSoqlInnerQuery(ctx: Parser.SoqlInnerQueryContext): void {
    const selectCtx = ctx.soqlSelectClause();
    if (!selectCtx) {
      throw Error('No select clause');
    }
    // normally we would want to selectCtx.enterRule(this) and delegate to
    // other functions but the antr4-tool's typescript definitions are not
    // perfect for listeners; workaround by type-checking
    if (selectCtx instanceof Parser.SoqlSelectExprsClauseContext) {
      (selectCtx as Parser.SoqlSelectExprsClauseContext)
        .soqlSelectExprs()
        .enterRule(this);
      this.select = new Impl.SelectExprsImpl(this.selectExpressions);
    } else {
      // not a modeled case
      this.select = this.toUnmodeledSyntax(selectCtx.start, selectCtx.stop);
    }
    const fromCtx = ctx.soqlFromClause();
    if (!fromCtx) {
      throw Error('No from clause');
    }
    fromCtx.enterRule(this);

    const whereCtx = ctx.soqlWhereClause();
    if (whereCtx) {
      this.where = this.toUnmodeledSyntax(whereCtx.start, whereCtx.stop);
    }
    const withCtx = ctx.soqlWithClause();
    if (withCtx) {
      this.with = this.toUnmodeledSyntax(withCtx.start, withCtx.stop);
    }
    const groupByCtx = ctx.soqlGroupByClause();
    if (groupByCtx) {
      this.groupBy = this.toUnmodeledSyntax(groupByCtx.start, groupByCtx.stop);
    }
    const orderByCtx = ctx.soqlOrderByClause();
    if (orderByCtx) {
      this.orderBy = this.toUnmodeledSyntax(orderByCtx.start, orderByCtx.stop);
    }
    const limitCtx = ctx.soqlLimitClause();
    if (limitCtx) {
      this.limit = this.toUnmodeledSyntax(limitCtx.start, limitCtx.stop);
    }
    const offsetCtx = ctx.soqlOffsetClause();
    if (offsetCtx) {
      this.offset = this.toUnmodeledSyntax(offsetCtx.start, offsetCtx.stop);
    }
    const bindCtx = ctx.soqlBindClause();
    if (bindCtx) {
      this.bind = this.toUnmodeledSyntax(bindCtx.start, bindCtx.stop);
    }
    const recordTrackingTypeCtx = ctx.soqlRecordTrackingType();
    if (recordTrackingTypeCtx) {
      this.recordTrackingType = this.toUnmodeledSyntax(
        recordTrackingTypeCtx.start,
        recordTrackingTypeCtx.stop
      );
    }
    const updateCtx = ctx.soqlUpdateStatsClause();
    if (updateCtx) {
      this.update = this.toUnmodeledSyntax(updateCtx.start, updateCtx.stop);
    }
  }

  public enterSoqlQuery(ctx: Parser.SoqlQueryContext): void {
    const innerCtx = ctx.soqlInnerQuery();
    innerCtx.enterRule(this);
    if (this.select && this.from) {
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
  }

  public getQuery(): Soql.Query | undefined {
    return this.query;
  }

  public toUnmodeledSyntax(start: Token, stop: Token): Soql.UnmodeledSyntax {
    if (!stop && start) {
      // some error states can cause this situation
      stop = start;
    }
    if (stop.stop < start.start) {
      // EOF token can cause this situation
      return new Impl.UnmodeledSyntaxImpl('');
    }
    const text = start.getInputStream().getText(start.start, stop.stop);
    return new Impl.UnmodeledSyntaxImpl(text);
  }
}
