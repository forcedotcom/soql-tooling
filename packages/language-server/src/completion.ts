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

import {
  CommonTokenStream,
  Parser,
  ParserRuleContext,
  TokenStream,
} from 'antlr4ts';

import * as c3 from 'antlr4-c3';
import { format } from 'util';
import { SoqlCompletionErrorStrategy } from './completion/SoqlCompletionErrorStrategy';
import {
  parseWHEREExprField,
  parseFROMSObject,
} from './completion/soql-query-analysis';

const SOBJECTS_ITEM_LABEL_PLACEHOLDER = '__SOBJECTS_PLACEHOLDER';
const SOBJECT_FIELDS_LABEL_PLACEHOLDER = '__SOBJECT_FIELDS_PLACEHOLDER';
const LITERAL_VALUES_FOR_FIELD = '__LITERAL_VALUES_FOR_FIELD';
const UPDATE_TRACKING = 'UPDATE TRACKING';
const UPDATE_VIEWSTAT = 'UPDATE VIEWSTAT';
const DEFAULT_SOBJECT = 'Object';

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

  const c3Candidates = collectC3CompletionCandidates(
    parser,
    parsedQuery,
    completionTokenIndex
  );

  const itemsFromTokens: CompletionItem[] = generateCandidatesFromTokens(
    c3Candidates.tokens,
    parsedQuery,
    lexer,
    tokenStream,
    completionTokenIndex
  );
  const itemsFromRules: CompletionItem[] = generateCandidatesFromRules(
    c3Candidates.rules,
    parsedQuery,
    tokenStream,
    completionTokenIndex
  );

  const completionItems = itemsFromTokens.concat(itemsFromRules);

  // If we got no proposals from C3, handle some special cases "manually"
  return handleSpecialCases(
    parsedQuery,
    tokenStream,
    completionTokenIndex,
    completionItems
  );
}

function collectC3CompletionCandidates(
  parser: Parser,
  parsedQuery: ParserRuleContext,
  completionTokenIndex: number
) {
  const core = new c3.CodeCompletionCore(parser);
  core.translateRulesTopDown = false;
  core.ignoredTokens = new Set([
    SoqlLexer.BIND,
    SoqlLexer.LPAREN,
    // SoqlLexer.DISTANCE, // Maybe handle it explicitly, as other built-in functions?
    SoqlLexer.COMMA,
    SoqlLexer.PLUS,
    SoqlLexer.MINUS,
    SoqlLexer.COLON,
    SoqlLexer.MINUS,
    // Ignore COUNT as a token. Handle it explicitly in Rules because the g4 grammar
    // declares 'COUNT()' explicitly, but not 'COUNT(xyz)'
    SoqlLexer.COUNT,
  ]);

  core.preferredRules = new Set([
    SoqlParser.RULE_soqlFromExprs,
    SoqlParser.RULE_soqlFromExpr,
    SoqlParser.RULE_soqlField,
    SoqlParser.RULE_soqlUpdateStatsClause,
    SoqlParser.RULE_soqlIdentifier,
    SoqlParser.RULE_soqlLiteralValue,
    SoqlParser.RULE_soqlLikeLiteral,
  ]);

  return core.collectCandidates(completionTokenIndex, parsedQuery);
}

const possibleIdentifierPrefix = /[\w]$/;
export type CursorPosition = { line: number; column: number };
/**
 * @returns the token index for which we want to provide completion candidates,
 * which depends on the cursor possition.
 *
 * @example
 * ```soql
 * SELECT id| FROM x    : Cursor touching the previous identifier token:
 *                        we want to continue completing that prior token position
 * SELECT id |FROM x    : Cursor NOT touching the previous identifier token:
 *                        we want to complete what comes on this new position
 * SELECT id   | FROM x : Cursor within whitespace block: we want to complete what
 *                        comes after the whitespace (we must return a non-WS token index)
 * ```
 */
export function findCursorTokenIndex(
  tokenStream: TokenStream,
  cursor: CursorPosition
) {
  // NOTE: cursor position is 1-based, while token's charPositionInLine is 0-based
  const cursorCol = cursor.column - 1;
  for (let i = 0; i < tokenStream.size; i++) {
    const t = tokenStream.get(i);

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
  return undefined;
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
  parsedQuery: SoqlQueryContext,
  lexer: SoqlLexer,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (let [tokenType, followingTokens] of tokens) {
    if (tokenType === tokenStream.get(tokenIndex).type) {
      continue;
    }
    const baseKeyword = tokenTypeToCandidateString(lexer, tokenType);
    if (!baseKeyword) continue;

    const followingKeywords = followingTokens
      .map((t) => tokenTypeToCandidateString(lexer, t))
      .join(' ');

    let itemText =
      followingKeywords.length > 0
        ? baseKeyword + ' ' + followingKeywords
        : baseKeyword;

    // Some "manual" improvements for some keywords:
    if (['IN', 'NOT IN'].includes(itemText)) {
      itemText = itemText + ' (';
    } else if (['INCLUDES', 'EXCLUDES', 'DISTANCE'].includes(itemText)) {
      itemText = itemText + '(';
    }

    const fieldDependentOperators: Set<number> = new Set<number>([
      SoqlLexer.LT,
      SoqlLexer.GT,
      SoqlLexer.INCLUDES,
      SoqlLexer.EXCLUDES,
      SoqlLexer.LIKE,
    ]);

    let newItem = newKeywordItem(itemText);

    if (fieldDependentOperators.has(tokenType)) {
      const soqlField = parseWHEREExprField(parsedQuery, tokenIndex);
      if (soqlField) {
        newItem = withSoqlContext(newItem, soqlField);
      }
    }

    items.push(newItem);

    // Clone extra related operators missing by C3 proposals
    if (['<', '>'].includes(itemText)) {
      items.push({ ...newItem, ...newKeywordItem(itemText + '=') });
    }
    if (itemText === '=') {
      items.push({ ...newItem, ...newKeywordItem('!=') });
      items.push({ ...newItem, ...newKeywordItem('<>') });
    }
  }
  return items;
}

const nonNullableOperators: Set<string> = new Set<string>([
  '<',
  '<=',
  '>',
  '>=',
  'INCLUDES',
  'EXCLUDES',
  'LIKE',
]);
function generateCandidatesFromRules(
  c3Rules: Map<number, c3.CandidateRule>,
  parsedQuery: SoqlQueryContext,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const completionItems: CompletionItem[] = [];

  for (let [ruleId, ruleData] of c3Rules) {
    switch (ruleId) {
      case SoqlParser.RULE_soqlUpdateStatsClause:
        // NOTE: We handle this one as a Rule instead of Tokens because
        // "TRACKING" and "VIEWSTAT" are not part of the grammar
        if (tokenIndex == ruleData.startTokenIndex) {
          completionItems.push(newKeywordItem(UPDATE_TRACKING));
          completionItems.push(newKeywordItem(UPDATE_VIEWSTAT));
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
            parseFROMSObject(parsedQuery, tokenIndex) || DEFAULT_SOBJECT;
          completionItems.push(
            withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
              sobjectName: fromSObject,
            })
          );
          if (
            ruleData.ruleList[ruleData.ruleList.length - 1] ===
            SoqlParser.RULE_soqlSelectExpr
          ) {
            completionItems.push(newKeywordItem('COUNT()'));
            completionItems.push(newSnippetItem('COUNT(...)', 'COUNT($1)'));
            completionItems.push(
              newSnippetItem('(SELECT ... FROM ...)', '(SELECT $2 FROM $1)')
            );
          }
        }
        break;

      // For some reason, c3 doesn't propose rule `soqlField` when inside soqlWhereExpr,
      // but it does propose soqlIdentifier, so we hinge off it for where expressions
      case SoqlParser.RULE_soqlIdentifier:
        if (
          tokenIndex == ruleData.startTokenIndex &&
          [
            SoqlParser.RULE_soqlWhereExpr,
            SoqlParser.RULE_soqlDistanceExpr,
          ].includes(ruleData.ruleList[ruleData.ruleList.length - 1])
        ) {
          const fromSObject =
            parseFROMSObject(parsedQuery, tokenIndex) || 'Object';
          completionItems.push(
            withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
              sobjectName: fromSObject,
            })
          );
        }
        break;
      case SoqlParser.RULE_soqlLiteralValue:
      case SoqlParser.RULE_soqlLikeLiteral:
        const soqlFieldExpr = parseWHEREExprField(parsedQuery, tokenIndex);
        if (soqlFieldExpr) {
          completionItems.push(
            withSoqlContext(newConstantItem(LITERAL_VALUES_FOR_FIELD), {
              sobjectName: soqlFieldExpr.sobjectName,
              fieldName: soqlFieldExpr.fieldName,
              notNillable:
                soqlFieldExpr.operator !== undefined &&
                nonNullableOperators.has(soqlFieldExpr.operator),
            })
          );
        }
        break;
    }
  }
  return completionItems;
}
function handleSpecialCases(
  parsedQuery: SoqlQueryContext,
  tokenStream: TokenStream,
  tokenIndex: number,
  completionItems: CompletionItem[]
): CompletionItem[] {
  if (completionItems.length == 0) {
    // SELECT FROM |
    if (
      isCursorAfter(tokenStream, tokenIndex, [SoqlLexer.SELECT, SoqlLexer.FROM])
    ) {
      completionItems.push(newObjectItem(SOBJECTS_ITEM_LABEL_PLACEHOLDER));
    }
    // SELECT (SELECT ), | FROM Xyz
    else if (
      isCursorAfter(tokenStream, tokenIndex, [SoqlLexer.COMMA]) &&
      isCursorBefore(tokenStream, tokenIndex, [SoqlLexer.FROM])
    ) {
      const fromSObject =
        parseFROMSObject(parsedQuery, tokenIndex) || DEFAULT_SOBJECT;
      completionItems.push(
        withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
          sobjectName: fromSObject,
        })
      );
      completionItems.push(newKeywordItem('TYPEOF'));
      completionItems.push(newKeywordItem('DISTANCE('));
      completionItems.push(newKeywordItem('COUNT()'));
      completionItems.push(newSnippetItem('COUNT(...)', 'COUNT($1)'));
      completionItems.push(
        newSnippetItem('(SELECT ... FROM ...)', '(SELECT $2 FROM $1)')
      );
    }
  }

  // Provide smart snippet for `SELECT`:
  if (completionItems.some((item) => item.label === 'SELECT')) {
    if (!isCursorBefore(tokenStream, tokenIndex, [SoqlLexer.FROM])) {
      completionItems.push(
        newSnippetItem('SELECT ... FROM ...', 'SELECT $2 FROM $1')
      );
    }
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
    insertText: text,
  };
}

interface SoqlItemContext {
  sobjectName: string;
  fieldName?: string;
  notNillable?: boolean;
}

function withSoqlContext(
  item: CompletionItem,
  soqlItemCtx: SoqlItemContext
): CompletionItem {
  item.data = { soqlContext: soqlItemCtx };
  return item;
}
function newFieldItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Field,
  };
}
function newConstantItem(text: string): CompletionItem {
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
