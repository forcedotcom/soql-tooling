import { SoqlParser } from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { SoqlLexer } from '@salesforce/soql-parser/lib/generated/SoqlLexer';
import { LowerCasingCharStream } from '@salesforce/soql-parser';
import { CompletionItemKind } from 'vscode-languageserver';

import { CommonTokenStream, TokenStream } from 'antlr4ts';

import * as c3 from 'antlr4-c3';

export function completionsFor(text: string, line: number, column: number) {
  const lexer = new SoqlLexer(new LowerCasingCharStream(text));
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new SoqlParser(tokenStream);
  parser.removeErrorListeners();
  const parsedQuery = parser.soqlQuery();

  const core = new c3.CodeCompletionCore(parser);
  core.preferredRules = new Set([
    SoqlParser.RULE_soqlFromExpr,
    SoqlParser.RULE_soqlField,
  ]);
  // core.showDebugOutput = true;
  const tokenIndex = findCursorTokenIndex(tokenStream, {
    line,
    column: column,
  });
  // console.log(`=== line: ${line}; col: ${column}; tokenIndex: ${tokenIndex}`);

  if (tokenIndex === undefined) {
    console.error(
      "Couldn't find cursor position on toke stream! Lexer might be skipping some tokens!"
    );
    return [];
  }

  const candidates = core.collectCandidates(tokenIndex, parsedQuery);

  const keywordCandidates: string[] = [];
  for (let token of candidates.tokens) {
    switch (token[0]) {
      case SoqlLexer.SELECT:
        keywordCandidates.push('SELECT');
        break;
      case SoqlLexer.FROM:
        keywordCandidates.push('FROM');
        break;
      case SoqlLexer.WHERE:
        keywordCandidates.push('WHERE');
        break;
      case SoqlLexer.LIMIT:
        keywordCandidates.push('LIMIT');
        break;
      case SoqlLexer.COMMA:
        keywordCandidates.push(',');
        break;
    }
  }

  let sObjectCandidates: string[] = [];
  let fieldCandidates: string[] = [];
  for (let rule of candidates.rules) {
    switch (rule[0]) {
      case SoqlParser.RULE_soqlGroupByClause:
        keywordCandidates.push('GROUP BY');
        break;
      case SoqlParser.RULE_soqlOrderByClause:
        keywordCandidates.push('ORDER BY');
        break;
      case SoqlParser.RULE_soqlFromExpr:
        sObjectCandidates.push('__SOBJECTS_PLACEHOLDER__');
        break;

      case SoqlParser.RULE_soqlField:
        fieldCandidates = ['field1', 'field2', 'field3'];
        break;
    }
  }

  // If we got no proposals from C3, handle some special cases "manually"
  if (
    sObjectCandidates.length == 0 &&
    keywordCandidates.length == 0 &&
    fieldCandidates.length == 0
  ) {
    if (
      isCursorAfter(tokenStream, tokenIndex, [SoqlLexer.SELECT, SoqlLexer.FROM])
    ) {
      sObjectCandidates.push('__SOBJECTS_PLACEHOLDER__');
    }
  }

  return [
    ...keywordCandidates.map((s) => ({
      label: s,
      kind: CompletionItemKind.Keyword,
    })),
    ...fieldCandidates.map((s) => {
      return {
        label: s,
        kind: CompletionItemKind.Field,
      };
    }),
    ...sObjectCandidates.map((s) => ({
      label: s,
      kind: CompletionItemKind.Class,
    })),
  ];
}

const notIdentifierPrefix = /[\W]$/;
export type CursorPosition = { line: number; column: number };
export function findCursorTokenIndex(
  tokenStream: TokenStream,
  cursor: CursorPosition
) {
  // NOTE: cursor position is 1-based, while token's charPositionInLine is 0-based
  const cursorCol = cursor.column - 1;
  for (let i = 0; i < tokenStream.size; i++) {
    const t = tokenStream.get(i);

    let stop = t.charPositionInLine + (t.text as string).length;
    if (t.line > cursor.line || (t.line == cursor.line && stop > cursorCol)) {
      return cursorCol > t.charPositionInLine ||
        (i > 0 &&
          notIdentifierPrefix.test(tokenStream.get(i - 1).text as string))
        ? i
        : i - 1;
    }
  }
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
