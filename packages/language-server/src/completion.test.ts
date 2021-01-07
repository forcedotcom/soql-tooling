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

function aggregateFunctionSnippet(name: string) {
  return {
    kind: CompletionItemKind.Snippet,
    label: name + '(...)',
    insertText: name + '($1)',
    insertTextFormat: InsertTextFormat.Snippet,
  };
}
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

  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT |', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n|', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n |', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id, |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id, boo,|', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id|', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id |', expectKeywords('FROM'));
  validateCompletionsFor('SELECT COUNT() |', expectKeywords('FROM'));
  validateCompletionsFor('SELECT COUNT(), |', []);

  // Inside Functions:
  validateCompletionsFor(
    'SELECT OwnerId, COUNT(|) FROM Account GROUP BY OwnerId',
    []
  );
});

describe('Code Completion on select fields: SELECT ... FROM XYZ', () => {
  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT | FROM Object', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |FROM Object', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT |FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo, Bar', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id, | FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT id,| FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id,| FROM', sobjectsFieldsFor('Object'));

  // with alias
  validateCompletionsFor('SELECT id,| FROM Foo F', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo F', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo F', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
});

describe('Code Completion on nested select fields: SELECT ... FROM XYZ', () => {
  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT | (SELECT bar FROM Bar) FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
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
  validateCompletionsFor('SELECT foo, (SELECT | FROM Bar) FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Bar'),
  ]);
  validateCompletionsFor('SELECT foo, (SELECT |, bar FROM Bar) FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Bar'),
  ]);
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, | FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, (SELECT | FROM XYZ) FROM Bar) FROM Foo',
    [...expectKeywords('COUNT()'), ...sobjectsFieldsFor('XYZ')]
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT |, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    [...expectKeywords('COUNT()'), ...sobjectsFieldsFor('Bar')]
  );
  validateCompletionsFor(
    'SELECT | (SELECT bar, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    [...expectKeywords('COUNT()'), ...sobjectsFieldsFor('Foo')]
  );

  validateCompletionsFor('SELECT (SELECT |) FROM Foo', [
    ...expectKeywords('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);

  // We used to have special code just to handle this particular case.
  // Not worth it, that's why it's skipped now.
  // We keep the test here because it'd be nice to solve it in a generic way
  validateCompletionsFor(
    'SELECT (SELECT ), | FROM Foo',
    sobjectsFieldsFor('Foo'),
    { skip: true }
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
    [...expectKeywords('COUNT()'), ...sobjectsFieldsFor('Xyz')]
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
    [...expectKeywords('COUNT()'), ...sobjectsFieldsFor('Bar')]
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
  validateCompletionsFor('SELECT FROM |', expectedSObjectCompletions, {});
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
    validateCompletionsFor('SELECT FROM|', [
      ...expectKeywords('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);

    validateCompletionsFor('SELECT\nFROM|', [
      ...expectKeywords('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);
    validateCompletionsFor('SELECT\nFROM|\nWHERE', [
      ...expectKeywords('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);
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

describe('Code Completion for GROUP BY', () => {
  validateCompletionsFor('SELECT id FROM Account GROUP BY |', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
    ...expectKeywords('ROLLUP', 'CUBE'),
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

  validateCompletionsFor(
    `SELECT Name FROM Account WHERE LastActivityDate < |`,
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'LastActivityDate',
            notNillable: true,
          },
        },
      },
    ]
  );
  validateCompletionsFor(
    `SELECT Name FROM Account WHERE LastActivityDate > |`,
    [
      {
        kind: CompletionItemKind.Constant,
        label: '__LITERAL_VALUES_FOR_FIELD',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            fieldName: 'LastActivityDate',
            notNillable: true,
          },
        },
      },
    ]
  );
});

describe('SELECT Function expressions', () => {
  validateCompletionsFor('SELECT DISTANCE(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);

  validateCompletionsFor('SELECT AVG(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);

  validateCompletionsFor('SELECT AVG(| FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);

  validateCompletionsFor('SELECT AVG(|), Id FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);
  validateCompletionsFor('SELECT Id, AVG(|) FROM Account', [
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
    ...expectKeywords('TYPEOF', 'DISTANCE('),
    aggregateFunctionSnippet('AVG'),
    aggregateFunctionSnippet('MIN'),
    aggregateFunctionSnippet('MAX'),
    aggregateFunctionSnippet('SUM'),
    aggregateFunctionSnippet('COUNT'),
    aggregateFunctionSnippet('COUNT_DISTINCT'),
    INNER_SELECT_snippet,
  ];
}
