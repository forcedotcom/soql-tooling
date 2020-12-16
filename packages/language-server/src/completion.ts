import {
  SoqlFromClauseContext,
  SoqlFromExprsContext,
  SoqlInnerQueryContext,
  SoqlParser,
  SoqlQueryContext,
  SoqlSelectClauseContext,
  SoqlSelectInnerQueryExprContext,
} from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { SoqlLexer } from '@salesforce/soql-parser/lib/generated/SoqlLexer';
import { SoqlParserListener } from '@salesforce/soql-parser/lib/generated/SoqlParserListener';
import { LowerCasingCharStream } from '@salesforce/soql-parser';
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver';

import {
  CommonTokenStream,
  DefaultErrorStrategy,
  ParserRuleContext,
  Token,
  TokenStream,
} from 'antlr4ts';
import {
  ParseTreeWalker,
  ParseTreeListener,
  ErrorNode,
  RuleNode,
} from 'antlr4ts/tree';

import * as c3 from 'antlr4-c3';
import { format } from 'util';
import { SoqlCompletionErrorStrategy } from './completion/SoqlCompletionErrorStrategy';

const SOBJECTS_ITEM_LABEL_PLACEHOLDER = '__SOBJECTS_PLACEHOLDER';
const SOBJECT_FIELDS_LABEL_PLACEHOLDER = '__SOBJECT_FIELDS_PLACEHOLDER:%s';

export function completionsFor(
  text: string,
  line: number,
  column: number
): CompletionItem[] {
  const lexer = new SoqlLexer(new LowerCasingCharStream(text));
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new SoqlParser(tokenStream);
  parser.removeErrorListeners();
  parser.errorHandler = new SoqlCompletionErrorStrategy();

  const parsedQuery = parser.soqlQuery();
  const core = new c3.CodeCompletionCore(parser);
  core.translateRulesTopDown = true;
  core.ignoredTokens = new Set([
    SoqlLexer.BIND,
    SoqlLexer.LPAREN,
    SoqlLexer.COMMA,
    SoqlLexer.PLUS,
    SoqlLexer.MINUS,
  ]);
  core.preferredRules = new Set([
    SoqlParser.RULE_soqlFromExprs,
    SoqlParser.RULE_soqlFromExpr,
    SoqlParser.RULE_soqlField,
    SoqlParser.RULE_soqlUpdateStatsClause,
    SoqlParser.RULE_soqlSelectClause,
    SoqlParser.RULE_soqlInteger,
    SoqlParser.RULE_parseReservedForFieldName, // <-- We list it here so that C3 ignores tokens of that rule
  ]);
  const tokenIndex = findCursorTokenIndex(tokenStream, {
    line,
    column: column,
  });

  if (tokenIndex === undefined) {
    console.error(
      "Couldn't find cursor position on toke stream! Lexer might be skipping some tokens!"
    );
    return [];
  }

  const candidatesFromGrammar = core.collectCandidates(tokenIndex, parsedQuery);
  const completionItems: CompletionItem[] = generateCandidatesFromTokens(
    candidatesFromGrammar.tokens,
    lexer
  );

  for (let [ruleId, ruleData] of candidatesFromGrammar.rules) {
    switch (ruleId) {
      case SoqlParser.RULE_soqlSelectClause:
        if (tokenIndex <= ruleData.startTokenIndex) {
          completionItems.push(newKeywordItem('SELECT'));

          if (
            [SoqlLexer.IDENTIFIER, SoqlLexer.SELECT, SoqlLexer.FROM].indexOf(
              tokenStream.get(tokenIndex).type
            ) < 0 &&
            !isCursorBefore(tokenStream, tokenIndex, [SoqlLexer.FROM])
          ) {
            completionItems.push(
              newSnippetItem('SELECT ... FROM ...', 'SELECT $2 FROM $1')
            );
          }
        }
        break;
      case SoqlParser.RULE_soqlUpdateStatsClause:
        // NOTE: We handle this one as a Rule instead of Tokens because
        // "TRACKING" and "VIEWSTAT" are not part of the grammar
        if (tokenIndex == ruleData.startTokenIndex) {
          completionItems.push(newKeywordItem('UPDATE TRACKING'));
          completionItems.push(newKeywordItem('UPDATE VIEWSTAT'));
        }
        break;
      case SoqlParser.RULE_soqlFromExprs:
        if (tokenIndex == ruleData.startTokenIndex) {
          completionItems.push(newObjectItem(SOBJECTS_ITEM_LABEL_PLACEHOLDER));
        }
        break;

      case SoqlParser.RULE_soqlField:
        if (tokenIndex == ruleData.startTokenIndex) {
          const fromSObject =
            SoqlQueryExtractor.getSObjectFor(parsedQuery, tokenIndex) ||
            'Object';
          completionItems.push(
            newFieldItem(format(SOBJECT_FIELDS_LABEL_PLACEHOLDER, fromSObject))
          );
          if (
            ruleData.ruleList[ruleData.ruleList.length - 1] ===
            SoqlParser.RULE_soqlSelectExpr
          ) {
            completionItems.push(
              newSnippetItem('(SELECT ... FROM ...)', '(SELECT $2 FROM $1)')
            );
          }
        }
        break;
      case SoqlParser.RULE_soqlInteger:
        if (tokenIndex == ruleData.startTokenIndex) {
          completionItems.push(newNumberItem('0'));
          completionItems.push(newNumberItem('1'));
          completionItems.push(newNumberItem('5'));
          completionItems.push(newNumberItem('10'));
          completionItems.push(newNumberItem('25'));
          completionItems.push(newNumberItem('100'));
        }
        break;
    }
  }

  // If we got no proposals from C3, handle some special cases "manually"
  if (completionItems.length == 0) {
    if (
      isCursorAfter(tokenStream, tokenIndex, [SoqlLexer.SELECT, SoqlLexer.FROM])
    ) {
      completionItems.push(newObjectItem(SOBJECTS_ITEM_LABEL_PLACEHOLDER));
    } else if (
      isCursorAfter(tokenStream, tokenIndex, [SoqlLexer.COMMA]) &&
      isCursorBefore(tokenStream, tokenIndex, [SoqlLexer.FROM])
    ) {
      const fromSObject =
        SoqlQueryExtractor.getSObjectFor(parsedQuery, tokenIndex) || 'Object';
      completionItems.push(
        newFieldItem(format(SOBJECT_FIELDS_LABEL_PLACEHOLDER, fromSObject))
      );
      completionItems.push(
        newSnippetItem('(SELECT ... FROM ...)', '(SELECT $2 FROM $1)')
      );
    }
  }

  return completionItems;
}

const possibleIdentifierPrefix = /[\w]$/;
export type CursorPosition = { line: number; column: number };
/**
  Return the token index for which we want to provide completion candidates,
  which depends on the cursor possition.

  Examples:

  SELECT id| FROM x     : Cursor touching the previous identifier token:
                          we want to continue completing that prior token position
  SELECT id |FROM x     : Cursor NOT touching the previous identifier token:
                          we want to complete what comes on this new position
  SELECT id   |  FROM x : Cursor within whitespace block: we want to complete what
                          comes after the whitespace (we must return a non-WS token index)
*/
export function findCursorTokenIndex(
  tokenStream: TokenStream,
  cursor: CursorPosition
) {
  // NOTE: cursor position is 1-based, while token's charPositionInLine is 0-based
  const cursorCol = cursor.column - 1;
  for (let i = 0; i < tokenStream.size; i++) {
    const t = tokenStream.get(i);

    if (t.line > cursor.line) {
      return i;
    }

    let tokenStartCol = t.charPositionInLine;
    let tokenEndCol = tokenStartCol + (t.text as string).length;

    if (
      t.line == cursor.line &&
      (tokenEndCol > cursorCol || t.type === SoqlLexer.EOF)
    ) {
      if (
        i > 0 &&
        tokenStartCol === cursorCol &&
        possibleIdentifierPrefix.test(tokenStream.get(i - 1).text as string)
      ) {
        return i - 1;
      } else if (tokenStream.get(i).type === SoqlLexer.WS) {
        return i + 1;
      } else return i;
    }
  }
}

function newKeywordItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Keyword,
    insertText: text + ' ',
  };
}
function newFieldItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Field,
  };
}

function newNumberItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Constant,
  };
}
function newObjectItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Class,
  };
}

function newSnippetItem(label: string, snippet: string): CompletionItem {
  return {
    label: label,
    kind: CompletionItemKind.Snippet,
    insertText: snippet,
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

function tokenTypeToCandidateString(
  lexer: SoqlLexer,
  tokenType: number
): string {
  return lexer.vocabulary
    .getLiteralName(tokenType)
    ?.toUpperCase()
    .replace(/^'|'$/g, '') as string;
}
function generateCandidatesFromTokens(
  tokens: Map<number, c3.TokenList>,
  lexer: SoqlLexer
): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (let [tokenType, followingTokens] of tokens) {
    const baseKeyword = tokenTypeToCandidateString(lexer, tokenType);
    if (!baseKeyword) continue;
    const followingKeywords = followingTokens
      .map((t) => tokenTypeToCandidateString(lexer, t))
      .join(' ');

    items.push(
      newKeywordItem(
        followingKeywords.length > 0
          ? baseKeyword + ' ' + followingKeywords
          : baseKeyword
      )
    );
  }
  return items;
}

function isCursorAfter(
  tokenStream: TokenStream,
  tokenIndex: number,
  matchingTokens: number[]
): boolean {
  const toMatch = matchingTokens.concat().reverse();
  let matchingIndex = 0;

  for (let i = tokenIndex - 1; i >= 0; i--) {
    const t = tokenStream.get(i);
    if (t.channel === SoqlLexer.HIDDEN) continue;
    if (t.type === toMatch[matchingIndex]) {
      matchingIndex++;
      if (matchingIndex === toMatch.length) return true;
    } else break;
  }
  return false;
}
function isCursorBefore(
  tokenStream: TokenStream,
  tokenIndex: number,
  matchingTokens: number[]
): boolean {
  const toMatch = matchingTokens.concat();
  let matchingIndex = 0;

  for (let i = tokenIndex; i < tokenStream.size; i++) {
    const t = tokenStream.get(i);
    if (t.channel === SoqlLexer.HIDDEN) continue;
    if (t.type === toMatch[matchingIndex]) {
      matchingIndex++;
      if (matchingIndex === toMatch.length) return true;
    } else break;
  }
  return false;
}
/***********

interface SelectFromPair {
  select: Token;
  from: Token;
  sobjectName: string;
}

class FromExpressionExtractor implements SoqlParserListener {
  sobjectName?: string;
  closestStartIndex = -1;

  selectsStack: Token[] = [];

  matchedSelectFroms: Array<SelectFromPair> = [];

  constructor(private cursorTokenIndex: number) {}

  static getSObjectFor(
    parsedQueryTree: SoqlQueryContext,
    cursorTokenIndex: number
  ): string | undefined {
    const listener = new FromExpressionExtractor(cursorTokenIndex);
    ParseTreeWalker.DEFAULT.walk<SoqlParserListener>(listener, parsedQueryTree);
    return listener.findSObjectName(cursorTokenIndex);
  }

  private isInside(pair: SelectFromPair, index: number): boolean {
    return pair.select.tokenIndex <= index && pair?.from.tokenIndex >= index;
  }
  public findSObjectName(index: number): string | undefined {
    let closest;

    for (let pair of this.matchedSelectFroms) {
      if (
        this.isInside(pair, index) &&
        (!closest ||
          index - pair.select.tokenIndex < index - closest.select.tokenIndex)
      ) {
        closest = pair;
      }
    }
    return closest?.sobjectName;
  }
  private foundMatch(fromToken: Token, sobjectName: string) {
    const selectToken = this.selectsStack.pop();
    if (selectToken) {
      this.matchedSelectFroms.push({
        select: selectToken,
        from: fromToken,
        sobjectName: sobjectName,
      });
    }
  }

  visitErrorNode(node: ErrorNode) {
    if (
      node.symbol.type === SoqlLexer.FROM &&
      node.parent &&
      // node.parent.ruleIndex === SoqlParser.RULE_soqlSelectExpr &&
      node.parent.childCount >= 2
    ) {
      const fromToken = node.symbol;
      const sobjectName = node.parent.getChild(1).text;
      this.foundMatch(fromToken, sobjectName);
    }
  }
  enterSoqlInnerQuery(ctx: SoqlInnerQueryContext) {
    this.selectsStack.push(ctx.start);
  }
  exitSoqlFromExprs(ctx: SoqlFromExprsContext) {
    if (ctx.children && ctx.children.length > 0) {
      const fromToken = ctx.parent?.start as Token;
      const sobjectName = ctx.getChild(0).getChild(0).text;
      this.foundMatch(fromToken, sobjectName);
    }
  }
}

*******/

interface InnerSoqlQuery {
  soqlInnerQueryNode: SoqlInnerQueryContext;
  select: Token;
  from?: Token;
  sobjectName?: string;
}
class SoqlQueryExtractor implements SoqlParserListener {
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

  visitErrorNode(node: ErrorNode) {
    if (node.parent) {
      const parentRule = node.parent?.ruleContext.ruleIndex;

      if (
        parentRule === SoqlParser.RULE_soqlSelectExpr &&
        node.symbol.type === SoqlLexer.FROM &&
        node.parent &&
        node.parent.childCount >= 2
      ) {
        const fromToken = node.symbol;
        const sobjectName = node.parent.getChild(1).text;

        const soqlInnerQueryNode = this.findSoqlInnerQueryAncestor(node.parent);
        if (soqlInnerQueryNode) {
          const innerQuery = this.innerSoqlQueries.get(
            (soqlInnerQueryNode as SoqlInnerQueryContext).start.tokenIndex
          );
          if (innerQuery) {
            innerQuery.from = fromToken;
            innerQuery.sobjectName = sobjectName;
          }
        }
        // } else if (parentRule === SoqlParser.RULE_soqlSelectClause) {
        // }
      }
    }
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

  // exitSoqlInnerQuery(ctx: SoqlInnerQueryContext) {
  // }
}
