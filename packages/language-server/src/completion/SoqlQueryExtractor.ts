import {
  SoqlFromExprsContext,
  SoqlInnerQueryContext,
  SoqlParser,
  SoqlQueryContext,
} from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { Token } from 'antlr4ts';
import {
  ParseTreeWalker,
  ParseTreeListener,
  ErrorNode,
  RuleNode,
} from 'antlr4ts/tree';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/generated/SoqlParserListener';

interface InnerSoqlQuery {
  soqlInnerQueryNode: SoqlInnerQueryContext;
  select: Token;
  from?: Token;
  sobjectName?: string;
}

export class SoqlQueryExtractor implements SoqlParserListener {
  selectsStack: Token[] = [];
  fromsStack: Array<[Token, string]> = [];

  matchedSelectFroms: Array<InnerSoqlQuery> = [];

  innerSoqlQueries = new Map<number, InnerSoqlQuery>();

  constructor(private cursorTokenIndex: number) {}

  static getSObjectFor(
    parsedQueryTree: SoqlQueryContext,
    cursorTokenIndex: number
  ): string | undefined {
    const listener = new SoqlQueryExtractor(cursorTokenIndex);
    ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(listener, parsedQueryTree);
    return listener.findInnerQuery(cursorTokenIndex)?.sobjectName;
  }
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

  private findInnerQuery(atIndex: number): InnerSoqlQuery | undefined {
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
