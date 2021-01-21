/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

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
  Token,
  TokenStream,
} from 'antlr4ts';

import * as c3 from 'antlr4-c3';
import {
  soqlFunctionsByName,
  soqlFunctions,
  soqlOperators,
} from './completion/soql-functions';
import { SoqlCompletionErrorStrategy } from './completion/SoqlCompletionErrorStrategy';
import {
  ParsedSoqlField,
  SoqlQueryAnalyzer,
} from './completion/soql-query-analysis';

const SOBJECTS_ITEM_LABEL_PLACEHOLDER = '__SOBJECTS_PLACEHOLDER';
const SOBJECT_FIELDS_LABEL_PLACEHOLDER = '__SOBJECT_FIELDS_PLACEHOLDER';
const LITERAL_VALUES_FOR_FIELD = '__LITERAL_VALUES_FOR_FIELD';
const UPDATE_TRACKING = 'UPDATE TRACKING';
const UPDATE_VIEWSTAT = 'UPDATE VIEWSTAT';
const DEFAULT_SOBJECT = 'Object';

const itemsForBuiltinFunctions = soqlFunctions.map((soqlFn) =>
  newFunctionItem(soqlFn.name)
);

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

  const soqlQueryAnalyzer = new SoqlQueryAnalyzer(parsedQuery);

  const itemsFromTokens: CompletionItem[] = generateCandidatesFromTokens(
    c3Candidates.tokens,
    soqlQueryAnalyzer,
    lexer,
    tokenStream,
    completionTokenIndex
  );
  const itemsFromRules: CompletionItem[] = generateCandidatesFromRules(
    c3Candidates.rules,
    soqlQueryAnalyzer,
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

export function last(array: any[]) {
  return array && array.length > 0 ? array[array.length - 1] : undefined;
}

const possibleIdentifierPrefix = /[\w]$/;
const lineSeparator = /\n|\r|\r\n/g;
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

    const tokenStartCol = t.charPositionInLine;
    const tokenEndCol = tokenStartCol + (t.text as string).length;
    const tokenStartLine = t.line;
    const tokenEndLine =
      t.type !== SoqlLexer.WS || !t.text
        ? tokenStartLine
        : tokenStartLine + (t.text.match(lineSeparator)?.length || 0);

    // NOTE: tokenEndCol makes sense only of tokenStartLine === tokenEndLine
    if (
      tokenEndLine > cursor.line ||
      (tokenStartLine === cursor.line && tokenEndCol > cursorCol)
    ) {
      if (
        i > 0 &&
        tokenStartLine === cursor.line &&
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

const fieldDependentOperators: Set<number> = new Set<number>([
  SoqlLexer.LT,
  SoqlLexer.GT,
  SoqlLexer.INCLUDES,
  SoqlLexer.EXCLUDES,
  SoqlLexer.LIKE,
]);

function generateCandidatesFromTokens(
  tokens: Map<number, c3.TokenList>,
  soqlQueryAnalyzer: SoqlQueryAnalyzer,
  lexer: SoqlLexer,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (let [tokenType, followingTokens] of tokens) {
    // Don't propose what's already at the cursor position
    if (tokenType === tokenStream.get(tokenIndex).type) {
      continue;
    }

    // Even though the grammar allows spaces between the < > and = signs
    // (for example, this is valid: `field <  =  'value'`), we don't want to
    // propose code completions like that
    if (
      tokenType === SoqlLexer.EQ &&
      isCursorAfter(tokenStream, tokenIndex, [[SoqlLexer.LT, SoqlLexer.GT]])
    ) {
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

    let soqlItemContext: SoqlItemContext | undefined = undefined;

    if (fieldDependentOperators.has(tokenType)) {
      const soqlFieldExpr = soqlQueryAnalyzer.extractWhereField(tokenIndex);
      if (soqlFieldExpr) {
        soqlItemContext = {
          sobjectName: soqlFieldExpr.sobjectName,
          fieldName: soqlFieldExpr.fieldName,
        };

        const soqlOperator = soqlOperators[itemText];
        soqlItemContext.onlyTypes = soqlOperator.types;
      }
    }

    // Some "manual" improvements for some keywords:
    if (['IN', 'NOT IN'].includes(itemText)) {
      itemText = itemText + ' (';
    } else if (['INCLUDES', 'EXCLUDES', 'DISTANCE'].includes(itemText)) {
      itemText = itemText + '(';
    } else if (itemText === 'COUNT') {
      // NOTE: The g4 grammar declares `COUNT()` explicitly, but not `COUNT(xyz)`.
      // Here we cover the first case:
      itemText = 'COUNT()';
    }

    let newItem = soqlItemContext
      ? withSoqlContext(newKeywordItem(itemText), soqlItemContext)
      : newKeywordItem(itemText);

    if (itemText === 'WHERE') {
      newItem.preselect = true;
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

function generateCandidatesFromRules(
  c3Rules: Map<number, c3.CandidateRule>,
  soqlQueryAnalyzer: SoqlQueryAnalyzer,
  tokenStream: TokenStream,
  tokenIndex: number
): CompletionItem[] {
  const completionItems: CompletionItem[] = [];

  for (let [ruleId, ruleData] of c3Rules) {
    const lastRuleId = ruleData.ruleList[ruleData.ruleList.length - 1];

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
        const innerQueryInfo = soqlQueryAnalyzer.innerQueryInfoAt(tokenIndex);
        const fromSObject = innerQueryInfo?.sobjectName || DEFAULT_SOBJECT;

        if (
          [
            SoqlParser.RULE_soqlSelectExpr,
            SoqlParser.RULE_soqlSemiJoin,
          ].includes(lastRuleId)
        ) {
          // At the start of any "soqlField" expression (inside SELECT, ORDER BY, GROUP BY, etc.)
          // or inside a function expression (i.e.: "AVG(|" )
          if (
            tokenIndex === ruleData.startTokenIndex ||
            isCursorAfter(tokenStream, tokenIndex, [
              [SoqlLexer.IDENTIFIER, SoqlLexer.COUNT],
              [SoqlLexer.LPAREN],
            ])
          ) {
            const soqlItemContext: SoqlItemContext = {
              sobjectName: fromSObject,
            };

            // NOTE: This code would be simpler if the grammar had an explicit
            // rule for function invocation. We should probably suggest such a change.
            // It's also more complicated because COUNT is a keyword type in the grammar,
            // and not an IDENTIFIER like all other functions
            const functionNameToken = searchTokenBeforeCursor(
              tokenStream,
              tokenIndex,
              [SoqlLexer.IDENTIFIER, SoqlLexer.COUNT]
            );
            if (functionNameToken) {
              const soqlFn = soqlFunctionsByName[functionNameToken?.text || ''];
              if (soqlFn) {
                soqlItemContext.onlyAggregatable = soqlFn.isAggregate;
                soqlItemContext.onlyTypes = soqlFn.types;
              }
            }
            completionItems.push(
              withSoqlContext(
                newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER),
                soqlItemContext
              )
            );
          }

          // SELECT | FROM Xyz
          if (tokenIndex === ruleData.startTokenIndex) {
            completionItems.push(...itemsForBuiltinFunctions);
            completionItems.push(
              newSnippetItem('(SELECT ... FROM ...)', '(SELECT $2 FROM $1)')
            );
          }
        }
        // ... GROUP BY |
        else if (
          lastRuleId === SoqlParser.RULE_soqlGroupByExprs &&
          tokenIndex === ruleData.startTokenIndex
        ) {
          const selectedFields = innerQueryInfo?.selectedFields || [];
          const groupedByFields = (
            innerQueryInfo?.groupByFields || []
          ).map((f) => f.toLowerCase());
          const groupFieldDifference = selectedFields.filter(
            (f) => !groupedByFields.includes(f.toLowerCase())
          );

          completionItems.push(
            withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
              sobjectName: fromSObject,
              onlyGroupable: true,
              mostLikelyItems:
                groupFieldDifference.length > 0
                  ? groupFieldDifference
                  : undefined,
            })
          );
        }

        // ... ORDER BY |
        else if (lastRuleId === SoqlParser.RULE_soqlOrderByClauseField) {
          completionItems.push(
            withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
              sobjectName: fromSObject,
              onlySortable: true,
            })
          );
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
          ].includes(lastRuleId)
        ) {
          const fromSObject =
            soqlQueryAnalyzer.innerQueryInfoAt(tokenIndex)?.sobjectName ||
            DEFAULT_SOBJECT;

          completionItems.push(
            withSoqlContext(newFieldItem(SOBJECT_FIELDS_LABEL_PLACEHOLDER), {
              sobjectName: fromSObject,
            })
          );
        }
        break;
      case SoqlParser.RULE_soqlLiteralValue:
      case SoqlParser.RULE_soqlLikeLiteral:
        const soqlFieldExpr = soqlQueryAnalyzer.extractWhereField(tokenIndex);
        if (soqlFieldExpr) {
          for (let literalItem of createItemsForLiterals(soqlFieldExpr))
            completionItems.push(literalItem);
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
      isCursorAfter(tokenStream, tokenIndex, [
        [SoqlLexer.SELECT],
        [SoqlLexer.FROM],
      ])
    ) {
      completionItems.push(newObjectItem(SOBJECTS_ITEM_LABEL_PLACEHOLDER));
    }
  }

  // Provide smart snippet for `SELECT`:
  if (completionItems.some((item) => item.label === 'SELECT')) {
    if (!isCursorBefore(tokenStream, tokenIndex, [[SoqlLexer.FROM]])) {
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
  matchingTokens: number[][]
): boolean {
  const toMatch = matchingTokens.concat().reverse();
  let matchingIndex = 0;

  for (let i = tokenIndex - 1; i >= 0; i--) {
    const t = tokenStream.get(i);
    if (t.channel === SoqlLexer.HIDDEN) continue;
    if (toMatch[matchingIndex].includes(t.type)) {
      matchingIndex++;
      if (matchingIndex === toMatch.length) return true;
    } else break;
  }
  return false;
}
function isCursorBefore(
  tokenStream: TokenStream,
  tokenIndex: number,
  matchingTokens: number[][]
): boolean {
  const toMatch = matchingTokens.concat();
  let matchingIndex = 0;

  for (let i = tokenIndex; i < tokenStream.size; i++) {
    const t = tokenStream.get(i);
    if (t.channel === SoqlLexer.HIDDEN) continue;
    if (toMatch[matchingIndex].includes(t.type)) {
      matchingIndex++;
      if (matchingIndex === toMatch.length) return true;
    } else break;
  }
  return false;
}

function searchTokenBeforeCursor(
  tokenStream: TokenStream,
  tokenIndex: number,
  searchForAnyTokenTypes: number[]
): Token | undefined {
  for (let i = tokenIndex - 1; i >= 0; i--) {
    const t = tokenStream.get(i);
    if (t.channel === SoqlLexer.HIDDEN) continue;
    if (searchForAnyTokenTypes.includes(t.type)) {
      return t;
    }
  }
  return undefined;
}

function newKeywordItem(text: string): CompletionItem {
  return {
    label: text,
    kind: CompletionItemKind.Keyword,
  };
}
function newFunctionItem(text: string): CompletionItem {
  return {
    label: text + '(...)',
    kind: CompletionItemKind.Function,
    insertText: text + '($1)',
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

export interface SoqlItemContext {
  sobjectName: string;
  fieldName?: string;
  onlyTypes?: string[];
  onlyAggregatable?: boolean;
  onlyGroupable?: boolean;
  onlySortable?: boolean;
  onlyNillable?: boolean;
  mostLikelyItems?: string[];
}

function withSoqlContext(
  item: CompletionItem,
  soqlItemCtx: SoqlItemContext
): CompletionItem {
  item.data = { soqlContext: soqlItemCtx };
  return item;
}
function newCompletionItem(
  text: string,
  kind: CompletionItemKind,
  extraOptions?: {}
): CompletionItem {
  return Object.assign(
    {
      label: text,
      kind: kind,
    },
    extraOptions
  );
}
function newFieldItem(text: string, extraOptions?: {}): CompletionItem {
  return newCompletionItem(text, CompletionItemKind.Field, extraOptions);
}
function newConstantItem(text: string): CompletionItem {
  return newCompletionItem(text, CompletionItemKind.Constant);
}

function newObjectItem(text: string): CompletionItem {
  return newCompletionItem(text, CompletionItemKind.Class);
}

function newSnippetItem(label: string, snippet: string): CompletionItem {
  return {
    label: label,
    kind: CompletionItemKind.Snippet,
    insertText: snippet,
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

function createItemsForLiterals(
  soqlFieldExpr: ParsedSoqlField
): CompletionItem[] {
  const soqlContext = {
    sobjectName: soqlFieldExpr.sobjectName,
    fieldName: soqlFieldExpr.fieldName,
  };

  const items: CompletionItem[] = [
    withSoqlContext(newCompletionItem('TRUE', CompletionItemKind.Value), {
      ...soqlContext,
      ...{ onlyTypes: ['boolean'] },
    }),
    withSoqlContext(newCompletionItem('FALSE', CompletionItemKind.Value), {
      ...soqlContext,
      ...{ onlyTypes: ['boolean'] },
    }),
    withSoqlContext(
      newSnippetItem(
        'YYYY-MM-DD',
        '${1:${CURRENT_YEAR}}-${2:${CURRENT_MONTH}}-${3:${CURRENT_DATE}}$0'
      ),
      { ...soqlContext, ...{ onlyTypes: ['date'] } }
    ),
    withSoqlContext(
      newSnippetItem(
        'YYYY-MM-DDThh:mm:ssZ',
        '${1:${CURRENT_YEAR}}-${2:${CURRENT_MONTH}}-${3:${CURRENT_DATE}}T${4:${CURRENT_HOUR}}:${5:${CURRENT_MINUTE}}:${6:${CURRENT_SECOND}}Z$0'
      ),
      { ...soqlContext, ...{ onlyTypes: ['datetime'] } }
    ),

    // Give the LSP client a chance to add additional literals:
    withSoqlContext(newConstantItem(LITERAL_VALUES_FOR_FIELD), soqlContext),
  ];

  const notNillableOperator = Boolean(
    soqlFieldExpr.operator !== undefined &&
      soqlOperators[soqlFieldExpr.operator]?.notNullable
  );
  if (!notNillableOperator) {
    items.push(
      withSoqlContext(newKeywordItem('NULL'), {
        ...soqlContext,
        ...{ onlyNillable: true },
      })
    );
  }
  return items;
}
