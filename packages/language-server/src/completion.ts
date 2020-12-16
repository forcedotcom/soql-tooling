import {
  SoqlParser,
  SoqlQueryContext,
} from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { SoqlLexer } from '@salesforce/soql-parser/lib/generated/SoqlLexer';
import { LowerCasingCharStream } from '@salesforce/soql-parser';
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver';

import { CommonTokenStream, Parser, TokenStream } from 'antlr4ts';

import * as c3 from 'antlr4-c3';
import { format } from 'util';
import { SoqlCompletionErrorStrategy } from './completion/SoqlCompletionErrorStrategy';
import { SoqlQueryExtractor } from './completion/SoqlQueryExtractor';

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
  const core = createC3CompletionEngine(parser);
  const completionTokenIndex = findCursorTokenIndex(tokenStream, {
    line,
    column: column,
  });

  if (completionTokenIndex === undefined) {
    console.error(
      "Couldn't find cursor position on toke stream! Lexer might be skipping some tokens!"
    );
    return [];
  }

  const c3Candidates = core.collectCandidates(
    completionTokenIndex,
    parsedQuery
  );
  const itemsFromTokens: CompletionItem[] = generateCandidatesFromTokens(
    c3Candidates.tokens,
    lexer
  );
  const itemsFromRules: CompletionItem[] = generateCandidatesFromRules(
    c3Candidates.rules,
    parsedQuery,
    tokenStream,
    completionTokenIndex
  );

  const completionItems = itemsFromTokens.concat(itemsFromRules);

  // If we got no proposals from C3, handle some special cases "manually"
  if (completionItems.length == 0) {
    return handleSpecialCases(parsedQuery, tokenStream, completionTokenIndex);
  }

  return completionItems;
}

function createC3CompletionEngine(parser: Parser) {
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
  return core;
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

function generateCandidatesFromRules(
  c3Rules: Map<number, c3.CandidateRule>,
  parsedQuery: SoqlQueryContext,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const completionItems: CompletionItem[] = [];

  for (let [ruleId, ruleData] of c3Rules) {
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
  return completionItems;
}
function handleSpecialCases(
  parsedQuery: SoqlQueryContext,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const completionItems: CompletionItem[] = [];

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

  return completionItems;
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
