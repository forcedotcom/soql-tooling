import { completionsFor } from './completion';
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver';

const SELECT_snippet = {
  kind: CompletionItemKind.Snippet,
  label: 'SELECT ... FROM ...',
  insertText: 'SELECT $2 FROM $1',
  insertTextFormat: InsertTextFormat.Snippet,
};
const INNER_SELECT_snippet = {
  kind: CompletionItemKind.Snippet,
  label: '(SELECT ... FROM ...)',
  insertText: '(SELECT $2 FROM $1)',
  insertTextFormat: InsertTextFormat.Snippet,
};

const expectedSimpleFieldCompletions: CompletionItem[] = [
  {
    kind: CompletionItemKind.Field,
    label: '__SOBJECT_FIELDS_PLACEHOLDER:Object',
  },
  INNER_SELECT_snippet,
]; /*.concat(expectKeywords('COUNT')) */

const expectedSObjectCompletions: CompletionItem[] = [
  {
    kind: CompletionItemKind.Class,
    label: '__SOBJECTS_PLACEHOLDER',
  },
];

describe('Code Completion on SELECT ...', () => {
  validateCompletionsFor('SELE|', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT|', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT |', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT\n|', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT\n |', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id, |', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id, boo,|', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id|', expectedSimpleFieldCompletions);
  validateCompletionsFor('SELECT id |', expectKeywords('FROM'));
});

describe('Code Completion on select fields: SELECT ... FROM XYZ', () => {
  validateCompletionsFor('SELECT | FROM Object', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT | FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |FROM Object', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT |FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT | FROM Foo, Bar', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT id, | FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT id,| FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id, FROM Foo', sobjectsFieldsFor('Foo'));

  // with alias
  validateCompletionsFor('SELECT id,| FROM Foo F', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo F', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id, FROM Foo F', sobjectsFieldsFor('Foo'));
});

describe('Code Completion on nested select fields: SELECT ... FROM XYZ', () => {
  validateCompletionsFor(
    'SELECT | (SELECT bar FROM Bar) FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT (SELECT bar FROM Bar),| FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT (SELECT bar FROM Bar), | FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT id, | (SELECT bar FROM Bar) FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT | FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT |, bar FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, | FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, (SELECT | FROM XYZ) FROM Bar) FROM Foo',
    sobjectsFieldsFor('XYZ')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT |, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT | (SELECT bar, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    sobjectsFieldsFor('Foo')
  );

  validateCompletionsFor('SELECT foo, ( | FROM Foo', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT foo, ( |FROM Foo', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT foo, (| FROM Foo', expectKeywords('SELECT'));
  validateCompletionsFor(
    'SELECT foo, (|    FROM Foo',
    expectKeywords('SELECT')
  );

  validateCompletionsFor(
    'SELECT foo, (|) FROM Foo',
    expectKeywords('SELECT').concat(SELECT_snippet)
  );
});

describe('Code Completion on SELECT XYZ FROM...', () => {
  validateCompletionsFor('SELECT id FROM |', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id\nFROM |', expectedSObjectCompletions);

  // cursor touching FROM should not complete with Sobject name
  validateCompletionsFor('SELECT id\nFROM|', expectKeywords('FROM'));
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

describe('Some keyword candidates', () => {
  validateCompletionsFor(
    'SELECT id FROM Account |',
    expectKeywords('LIMIT', 'WHERE', 'ORDER BY', 'GROUP BY')
  );
});

function expectKeywords(...words: string[]): CompletionItem[] {
  return words.map((s) => ({
    kind: CompletionItemKind.Keyword,
    label: s,
    insertText: s + ' ',
  }));
}

function validateCompletionsFor(
  text: string,
  expectedItems: CompletionItem[],
  cursorChar: string = '|'
) {
  it(text, () => {
    if (text.indexOf(cursorChar) != text.lastIndexOf(cursorChar)) {
      throw new Error(
        `Test text must have 1 and only 1 cursor (char: ${cursorChar})`
      );
    }

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

function sobjectsFieldsFor(sbojectName: string) {
  return [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER:' + sbojectName,
    },
    INNER_SELECT_snippet,
  ];
}
