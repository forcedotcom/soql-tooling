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

const COUNT_snippet = {
  kind: CompletionItemKind.Snippet,
  label: 'COUNT(...)',
  insertText: 'COUNT($1)',
  insertTextFormat: InsertTextFormat.Snippet,
};

const expectedSObjectCompletions: CompletionItem[] = [
  {
    kind: CompletionItemKind.Class,
    label: '__SOBJECTS_PLACEHOLDER',
  },
];

describe('Code Completion on invalid cursor position', () => {
  it('Should return empty if cursor is on non-exitent line', () => {
    expect(completionsFor('SELECT id FROM Foo', 2, 5)).toHaveLength(0);
  });
});

describe('Code Completion on SELECT ...', () => {
  validateCompletionsFor('|', [...expectKeywords('SELECT'), SELECT_snippet]);
  validateCompletionsFor('SELE|', [
    ...expectKeywords('SELECT'),
    SELECT_snippet,
  ]);
  validateCompletionsFor('| FROM', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT|', []);
  validateCompletionsFor('SELECT |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT\n|', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT\n |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id, |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id, boo,|', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id|', sobjectsFieldsFor('Object'));
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
  validateCompletionsFor('SELECT id,| FROM', sobjectsFieldsFor('Object'));

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

  validateCompletionsFor(
    'SELECT (SELECT |) FROM Foo',
    sobjectsFieldsFor('Object')
  );

  validateCompletionsFor(
    'SELECT (SELECT ), | FROM Foo',
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

  validateCompletionsFor(
    'SELECT foo, (SELECT bar FROM Bar), (SELECT | FROM Xyz) FROM Foo',
    sobjectsFieldsFor('Xyz')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar FROM Bar), (SELECT xyz, | FROM Xyz) FROM Foo',
    sobjectsFieldsFor('Xyz')
  );
  validateCompletionsFor(
    'SELECT foo, | (SELECT bar FROM Bar), (SELECT xyz FROM Xyz) FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar FROM Bar), | (SELECT xyz FROM Xyz) FROM Foo',
    sobjectsFieldsFor('Foo')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT | FROM Bar), (SELECT xyz FROM Xyz) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
});

describe('Code Completion on SELECT XYZ FROM...', () => {
  validateCompletionsFor('SELECT id FROM |', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id\nFROM |', expectedSObjectCompletions);

  // cursor touching FROM should not complete with Sobject name
  validateCompletionsFor('SELECT id\nFROM|', []);
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
    validateCompletionsFor('SELECT FROM|', sobjectsFieldsFor('Object'));

    validateCompletionsFor('SELECT\nFROM|', sobjectsFieldsFor('Object'));
    validateCompletionsFor('SELECT\nFROM|\nWHERE', sobjectsFieldsFor('Object'));
  });

  validateCompletionsFor('SELECTHHH  FROMXXX |', []);
});

describe('Code Completion for ORDER BY', () => {
  validateCompletionsFor('SELECT id FROM Account ORDER BY |', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
    ...expectKeywords('DISTANCE('),
  ]);
});

describe('Some keyword candidates after FROM clause', () => {
  validateCompletionsFor(
    'SELECT id FROM Account |',
    expectKeywords(
      'FOR',
      'OFFSET',
      'LIMIT',
      'ORDER BY',
      'GROUP BY',
      'WITH',
      'WHERE',
      'UPDATE TRACKING',
      'UPDATE VIEWSTAT'
    )
  );
  validateCompletionsFor(
    'SELECT id FROM Account FOR |',
    expectKeywords('VIEW', 'REFERENCE')
  );

  validateCompletionsFor(
    'SELECT id FROM Account WITH |',
    expectKeywords('DATA CATEGORY')
  );

  validateCompletionsFor(
    'SELECT Account.Name, (SELECT FirstName, LastName FROM Contacts |) FROM Account',
    expectKeywords(
      'FOR',
      'OFFSET',
      'LIMIT',
      'ORDER BY',
      'GROUP BY',
      'WITH',
      'WHERE',
      'UPDATE TRACKING',
      'UPDATE VIEWSTAT'
    )
  );

  validateCompletionsFor('SELECT id FROM Account LIMIT |', []);
});

describe('WHERE clause', () => {
  validateCompletionsFor('SELECT id FROM Account WHERE |', [
    ...expectKeywords('DISTANCE(', 'NOT'),
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);
  validateCompletionsFor('SELECT id FROM Account WHERE Name |', [
    ...expectKeywords('IN (', 'NOT IN (', '=', '!=', '<>'),
    ...expectKeywordsWithFieldData('Account', 'Name', [
      'INCLUDES(',
      'EXCLUDES(',
      '<',
      '<=',
      '>',
      '>=',
      'LIKE',
    ]),
  ]);
  validateCompletionsFor('SELECT id FROM Account WHERE Type IN (|', [
    ...expectKeywords('SELECT'),
    SELECT_snippet,
    {
      kind: CompletionItemKind.Constant,
      label: '__LITERAL_VALUES_FOR_FIELD',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          fieldName: 'Type',
          notNillable: false,
        },
      },
    },
  ]);
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type IN ('Customer', |)",
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'Type',
            notNillable: false,
          },
        },
      },
    ]
  );
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type IN (|, 'Customer')",
    [
      ...expectKeywords('SELECT'),
      SELECT_snippet,
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'Type',
            notNillable: false,
          },
        },
      },
    ]
  );

  // NOTE: Unlike IN(), INCLUDES()/EXCLUDES() never support NULL in the list
  validateCompletionsFor(
    'SELECT Channel FROM QuickText WHERE Channel INCLUDES(|',
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'QuickText',
            fieldName: 'Channel',
            notNillable: true,
          },
        },
      },
    ]
  );
  validateCompletionsFor(
    "SELECT Channel FROM QuickText WHERE Channel EXCLUDES('Email', |",
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'QuickText',
            fieldName: 'Channel',
            notNillable: true,
          },
        },
      },
    ]
  );
  validateCompletionsFor('SELECT id FROM Account WHERE Type = |', [
    {
      kind: CompletionItemKind.Constant,
      label: '__LITERAL_VALUES_FOR_FIELD',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          fieldName: 'Type',
          notNillable: false,
        },
      },
    },
  ]);
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type = 'Boo' OR Name = |",
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'Name',
            notNillable: false,
          },
        },
      },
    ]
  );
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type = 'Boo' OR Name LIKE |",
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'Name',
            notNillable: true,
          },
        },
      },
    ]
  );
  validateCompletionsFor('SELECT id FROM Account WHERE Account.Type = |', [
    {
      kind: CompletionItemKind.Constant,
      label: '__LITERAL_VALUES_FOR_FIELD',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          fieldName: 'Type',
          notNillable: false,
        },
      },
    },
  ]);
});

describe('Some special functions', () => {
  validateCompletionsFor('SELECT DISTANCE(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);
});

function expectKeywords(...words: string[]): CompletionItem[] {
  return words.map((s) => ({
    kind: CompletionItemKind.Keyword,
    label: s,
    insertText: s,
  }));
}
function expectKeywordsWithFieldData(
  sobjectName: string,
  fieldName: string,
  words: string[]
): CompletionItem[] {
  return words.map((s) => ({
    kind: CompletionItemKind.Keyword,
    label: s,
    insertText: s,
    data: {
      soqlContext: { sobjectName: sobjectName, fieldName: fieldName },
    },
  }));
}
function expectItems(
  kind: CompletionItemKind,
  ...labels: string[]
): CompletionItem[] {
  return labels.map((s) => ({
    kind: kind,
    label: s,
  }));
}

function validateCompletionsFor(
  text: string,
  expectedItems: CompletionItem[],
  options: { skip?: boolean; only?: boolean; cursorChar?: string } = {}
) {
  const itFn = options.skip ? xit : options.only ? it.only : it;
  const cursorChar = options.cursorChar || '|';
  itFn(text, () => {
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

    // NOTE: we don't use Sets here because when there are failures, the error
    // message is not useful
    expectedItems.forEach((item) => expect(completions).toContainEqual(item));
    completions.forEach((item) => expect(expectedItems).toContainEqual(item));
  });
}

function getCursorPosition(text: string, cursorChar: string): [number, number] {
  for (const [line, lineText] of text.split('\n').entries()) {
    const column = lineText.indexOf(cursorChar);
    if (column >= 0) return [line + 1, column + 1];
  }
  throw new Error(`Cursor ${cursorChar} not found in ${text} !`);
}

function sobjectsFieldsFor(sobjectName: string) {
  return [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: sobjectName } },
    },
    ...expectKeywords('TYPEOF', 'DISTANCE(', 'COUNT()'),
    COUNT_snippet,
    INNER_SELECT_snippet,
  ];
}
