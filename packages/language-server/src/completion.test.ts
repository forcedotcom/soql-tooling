import { completionsFor } from './completion';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

const expectedSimpleFieldCompletions: CompletionItem[] = [
  { kind: CompletionItemKind.Field, label: 'field1' },
  { kind: CompletionItemKind.Field, label: 'field2' },
  { kind: CompletionItemKind.Field, label: 'field3' },
];
const expectedSObjectCompletions: CompletionItem[] = [
  {
    kind: CompletionItemKind.Class,
    label: '__SOBJECTS_PLACEHOLDER__',
  },
];

describe('Code Completion on empty file', () => {
  validateCompletionsFor('|', [
    { kind: CompletionItemKind.Keyword, label: 'SELECT' },
  ]);
});

describe('Code Completion on SELECT ', () => {
  validateCompletionsFor('SELECT |', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id, |', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id, boo,|', expectedSimpleFieldCompletions);

  validateCompletionsFor(
    'SELECT id |',
    expectKeywords(',', 'FROM').concat(expectedSimpleFieldCompletions)
  );
});

describe('Code Completion on SELECT fields FROM', () => {
  validateCompletionsFor('SELECT id FROM |', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id\nFROM |', expectedSObjectCompletions);

  // cursor touching FROM should not complete with Sobject name
  validateCompletionsFor(
    'SELECT id\nFROM|',
    expectKeywords(',', 'FROM').concat(expectedSimpleFieldCompletions)
  );
  validateCompletionsFor(
    'SELECT id FROM |WHERE ORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id FROM | WHERE ORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id FROM |  WHERE ORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id FROM  | WHERE ORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id \nFROM |\nWHERE\nORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor('SELECTHHH id FROMXXX |', []);
});

describe('Code Completion on nested SELECT fields FROM', () => {
  validateCompletionsFor(
    'SELECT id, (SELECT id FROM |) FROM Foo',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id, (SELECT id FROM Foo) FROM |',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id, (SELECT FROM |) FROM Foo', // No fields on SELECT
    expectedSObjectCompletions
  );
});

describe('Code Completion on SELECT FROM (no columns on SELECT)', () => {
  validateCompletionsFor('SELECT FROM |', expectedSObjectCompletions);
  validateCompletionsFor('SELECT\nFROM |', expectedSObjectCompletions);

  validateCompletionsFor(
    'SELECT  FROM | WHERE ORDER BY',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT\nFROM |\nWHERE\nORDER BY',
    expectedSObjectCompletions
  );

  describe('Cursor is still touching FROM: it should still complete with fieldnames, and not SObject names', () => {
    validateCompletionsFor('SELECT FROM|', expectedSimpleFieldCompletions);

    validateCompletionsFor('SELECT\nFROM|', expectedSimpleFieldCompletions);
    validateCompletionsFor(
      'SELECT\nFROM|\nWHERE',
      expectedSimpleFieldCompletions
    );
  });
  validateCompletionsFor('SELECTHHH  FROMXXX |', []);
});

function expectKeywords(...words: string[]): CompletionItem[] {
  return words.map((s) => ({ kind: CompletionItemKind.Keyword, label: s }));
}

function validateCompletionsFor(
  text: string,
  expectedItems: CompletionItem[],
  cursorChar: string = '|'
) {
  it(text, () => {
    const [line, column] = getCursorPosition(text, cursorChar);
    const completions = completionsFor(
      text.replace(cursorChar, ''),
      line,
      column
    );
    expect(completions).toEqual(expectedItems);
  });
}

function getCursorPosition(text: string, cursorChar: string): [number, number] {
  for (const [line, lineText] of text.split('\n').entries()) {
    const column = lineText.indexOf(cursorChar);
    if (column >= 0) return [line + 1, column + 1];
  }
  throw new Error(`Cursor ${cursorChar} not found in ${text} !`);
}
