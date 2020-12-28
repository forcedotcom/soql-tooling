import {
  SoqlFromExprsContext,
  SoqlInnerQueryContext,
  SoqlParser,
  SoqlQueryContext,
  SoqlWhereExprContext,
} from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { ParserRuleContext, Token } from 'antlr4ts';
import { ParseTreeWalker, RuleNode } from 'antlr4ts/tree';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/generated/SoqlParserListener';

export function parseFROMSObject(
  parsedQueryTree: SoqlQueryContext,
  cursorTokenIndex: number
): string | undefined {
  const listener = new SoqlFROMAnalyzer(cursorTokenIndex);
  ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(listener, parsedQueryTree);
  return listener.findInnerQuery(cursorTokenIndex)?.sobjectName;
}
interface InnerSoqlQuery {
  soqlInnerQueryNode: SoqlInnerQueryContext;
  select: Token;
  from?: Token;
  sobjectName?: string;
}

class SoqlFROMAnalyzer implements SoqlParserListener {
  selectsStack: Token[] = [];
  fromsStack: Array<[Token, string]> = [];

  matchedSelectFroms: Array<InnerSoqlQuery> = [];

  innerSoqlQueries = new Map<number, InnerSoqlQuery>();

  constructor(private cursorTokenIndex: number) {}

  private queryContainsTokenIndex(
    innerQuery: InnerSoqlQuery,
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

  public findInnerQuery(atIndex: number): InnerSoqlQuery | undefined {
    let closestQuery: InnerSoqlQuery | undefined;
    for (let query of this.innerSoqlQueries.values()) {
      if (this.queryContainsTokenIndex(query, atIndex)) {
        closestQuery = query;
      }
    }
    return closestQuery;
  }

  private findSoqlInnerQueryAncestor(
    node: RuleNode | undefined
  ): SoqlInnerQueryContext | undefined {
    let soqlInnerQueryNode = node;
    while (
      soqlInnerQueryNode &&
      soqlInnerQueryNode.ruleContext.ruleIndex !==
        SoqlParser.RULE_soqlInnerQuery
    ) {
      soqlInnerQueryNode = soqlInnerQueryNode.parent;
    }

    return soqlInnerQueryNode
      ? (soqlInnerQueryNode as SoqlInnerQueryContext)
      : undefined;
  }

  enterSoqlInnerQuery(ctx: SoqlInnerQueryContext) {
    this.innerSoqlQueries.set(ctx.start.tokenIndex, {
      select: ctx.start,
      soqlInnerQueryNode: ctx,
    });
  }

  exitSoqlFromExprs(ctx: SoqlFromExprsContext) {
    const soqlInnerQueryNode = this.findSoqlInnerQueryAncestor(ctx);

    if (ctx.children && ctx.children.length > 0 && soqlInnerQueryNode) {
      const fromToken = ctx.parent?.start as Token;
      const sobjectName = ctx.getChild(0).getChild(0).text;
      const selectFromPair = this.innerSoqlQueries.get(
        soqlInnerQueryNode.start.tokenIndex
      );
      if (selectFromPair) {
        selectFromPair.from = fromToken;
        selectFromPair.sobjectName = sobjectName;
      }
    }
  }
}

interface ParsedSoqlField {
  sobjectName: string;
  fieldName: string;
  operator?: string;
}

export function parseWHEREExprField(
  parsedQueryTree: SoqlQueryContext,
  cursorTokenIndex: number
): ParsedSoqlField | undefined {
  const sobject = parseFROMSObject(parsedQueryTree, cursorTokenIndex);

  if (sobject) {
    const analyzer = new SoqlFieldAnalyzer(cursorTokenIndex, sobject);
    ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(analyzer, parsedQueryTree);
    return analyzer.result;
  } else {
    return undefined;
  }
}

class SoqlFieldAnalyzer implements SoqlParserListener {
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
