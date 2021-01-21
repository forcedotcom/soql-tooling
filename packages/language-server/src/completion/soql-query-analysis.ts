import {
  SoqlFromExprsContext,
  SoqlGroupByExprsContext,
  SoqlInnerQueryContext,
  SoqlParser,
  SoqlQueryContext,
  SoqlSelectColumnExprContext,
  SoqlSemiJoinContext,
  SoqlWhereExprContext,
} from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { ParserRuleContext, RuleContext, Token } from 'antlr4ts';
import { ParseTreeWalker, RuleNode } from 'antlr4ts/tree';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/generated/SoqlParserListener';

interface InnerSoqlQueryInfo {
  soqlInnerQueryNode: ParserRuleContext;
  select: Token;
  from?: Token;
  sobjectName?: string;
  selectedFields?: string[];
  groupByFields?: string[];
}

export interface ParsedSoqlField {
  sobjectName: string;
  fieldName: string;
  operator?: string;
}
export class SoqlQueryAnalyzer {
  private innerQueriesListener = new SoqlInnerQueriesListener();
  constructor(protected parsedQueryTree: SoqlQueryContext) {
    ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(
      this.innerQueriesListener,
      parsedQueryTree
    );
  }

  innerQueryInfoAt(cursorTokenIndex: number): InnerSoqlQueryInfo | undefined {
    return this.innerQueriesListener.findInnerQuery(cursorTokenIndex);
  }

  extractWhereField(cursorTokenIndex: number): ParsedSoqlField | undefined {
    const sobject = this.innerQueryInfoAt(cursorTokenIndex)?.sobjectName;

    if (sobject) {
      const whereFieldListener = new SoqlWhereFieldListener(
        cursorTokenIndex,
        sobject
      );
      ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(
        whereFieldListener,
        this.parsedQueryTree
      );
      return whereFieldListener.result;
    } else {
      return undefined;
    }
  }
}

class SoqlInnerQueriesListener implements SoqlParserListener {
  selectsStack: Token[] = [];
  fromsStack: Array<[Token, string]> = [];

  matchedSelectFroms: Array<InnerSoqlQueryInfo> = [];
  innerSoqlQueries = new Map<number, InnerSoqlQueryInfo>();

  private queryContainsTokenIndex(
    innerQuery: InnerSoqlQueryInfo,
    atTokenIndex: number
  ): boolean {
    // NOTE: We use the parent node to take into account the enclosing
    // parentheses (in the case of inner SELECTs), and the whole text until EOF
    // (for the top-level SELECT). BTW: soqlInnerQueryNode always has a parent.
    const queryNode = innerQuery.soqlInnerQueryNode.parent
      ? innerQuery.soqlInnerQueryNode.parent
      : innerQuery.soqlInnerQueryNode;

    const startIndex = queryNode.start.tokenIndex;
    const stopIndex = queryNode.stop?.tokenIndex;

    return (
      atTokenIndex > startIndex && !!stopIndex && atTokenIndex <= stopIndex
    );
  }

  public findInnerQuery(atIndex: number): InnerSoqlQueryInfo | undefined {
    let closestQuery: InnerSoqlQueryInfo | undefined;
    for (let query of this.innerSoqlQueries.values()) {
      if (this.queryContainsTokenIndex(query, atIndex)) {
        closestQuery = query;
      }
    }
    return closestQuery;
  }

  private findAncestorSoqlInnerQueryContext(
    node: RuleNode | undefined
  ): ParserRuleContext | undefined {
    let soqlInnerQueryNode = node;
    while (
      soqlInnerQueryNode &&
      ![SoqlParser.RULE_soqlInnerQuery, SoqlParser.RULE_soqlSemiJoin].includes(
        soqlInnerQueryNode.ruleContext.ruleIndex
      )
    ) {
      soqlInnerQueryNode = soqlInnerQueryNode.parent;
    }

    return soqlInnerQueryNode
      ? (soqlInnerQueryNode as ParserRuleContext)
      : undefined;
  }

  private innerQueryForContext(ctx: RuleNode): InnerSoqlQueryInfo | undefined {
    const soqlInnerQueryNode = this.findAncestorSoqlInnerQueryContext(ctx);
    if (soqlInnerQueryNode) {
      const selectFromPair = this.innerSoqlQueries.get(
        soqlInnerQueryNode.start.tokenIndex
      );
      return selectFromPair;
    }
    return undefined;
  }

  enterSoqlInnerQuery(ctx: SoqlInnerQueryContext) {
    this.innerSoqlQueries.set(ctx.start.tokenIndex, {
      select: ctx.start,
      soqlInnerQueryNode: ctx,
    });
  }

  enterSoqlSemiJoin(ctx: SoqlSemiJoinContext) {
    this.innerSoqlQueries.set(ctx.start.tokenIndex, {
      select: ctx.start,
      soqlInnerQueryNode: ctx,
    });
  }

  exitSoqlFromExprs(ctx: SoqlFromExprsContext) {
    const selectFromPair = this.innerQueryForContext(ctx);

    if (ctx.children && ctx.children.length > 0 && selectFromPair) {
      const fromToken = ctx.parent?.start as Token;
      const sobjectName = ctx.getChild(0).getChild(0).text;
      selectFromPair.from = fromToken;
      selectFromPair.sobjectName = sobjectName;
    }
  }

  enterSoqlSelectColumnExpr(ctx: SoqlSelectColumnExprContext) {
    if (ctx.soqlField().childCount === 1) {
      const soqlField = ctx.soqlField();
      const soqlIdentifiers = soqlField.soqlIdentifier();
      if (soqlIdentifiers.length === 1) {
        const selectFromPair = this.innerQueryForContext(ctx);
        if (selectFromPair) {
          if (!selectFromPair.selectedFields) {
            selectFromPair.selectedFields = [];
          }
          selectFromPair.selectedFields.push(soqlIdentifiers[0].text);
        }
      }
    }
  }

  enterSoqlGroupByExprs(ctx: SoqlGroupByExprsContext) {
    const groupByFields: string[] = [];

    ctx.soqlField().forEach((soqlField) => {
      const soqlIdentifiers = soqlField.soqlIdentifier();
      if (soqlIdentifiers.length === 1) {
        groupByFields.push(soqlIdentifiers[0].text);
      }
    });

    if (groupByFields.length > 0) {
      const selectFromPair = this.innerQueryForContext(ctx);

      if (selectFromPair) {
        selectFromPair.groupByFields = groupByFields;
      }
    }
  }
}

class SoqlWhereFieldListener implements SoqlParserListener {
  result?: ParsedSoqlField;
  resultDistance = Number.MAX_VALUE;

  constructor(
    private readonly cursorTokenIndex: number,
    private sobject: string
  ) {}

  enterEveryRule(ctx: ParserRuleContext) {
    if (ctx.ruleContext.ruleIndex === SoqlParser.RULE_soqlWhereExpr) {
      if (ctx.start.tokenIndex <= this.cursorTokenIndex) {
        const distance = this.cursorTokenIndex - ctx.start.tokenIndex;
        if (distance < this.resultDistance) {
          this.resultDistance = distance;
          const soqlField = ctx.getChild(0).text;

          // Handle basic "dot" expressions
          // TODO: Support Aliases
          const fieldComponents = soqlField.split('.', 2);
          if (fieldComponents[0] === this.sobject) {
            fieldComponents.shift();
          }

          const operator =
            ctx.childCount > 2 ? ctx.getChild(1).text : undefined;

          this.result = {
            sobjectName: this.sobject,
            fieldName: fieldComponents.join('.'),
            operator: operator,
          };
        }
      }
    }
  }
}
