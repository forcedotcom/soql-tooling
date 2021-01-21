/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { completionsFor, SoqlItemContext } from './completion';
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

function functionCallItem(name: string, soqlItemContext?: SoqlItemContext) {
  return Object.assign(
    {
      kind: CompletionItemKind.Function,
      label: name + '(...)',
      insertText: name + '($1)',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    soqlItemContext ? { data: { soqlContext: soqlItemContext } } : {}
  );
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
  validateCompletionsFor('|', [expectKeyword('SELECT'), SELECT_snippet]);
  validateCompletionsFor('SELE|', [
    ...expectKeywords('SELECT'),
    SELECT_snippet,
  ]);
  validateCompletionsFor('| FROM', expectKeywords('SELECT'));
  validateCompletionsFor('SELECT|', []);

  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT |', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n|', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n |', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n\n |\n\n', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id, |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id, boo,|', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id|', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id |', expectKeywords('FROM'));
  validateCompletionsFor('SELECT COUNT() |', expectKeywords('FROM'));
  validateCompletionsFor('SELECT COUNT(), |', []);

  // Inside Function expression:
  validateCompletionsFor('SELECT OwnerId, COUNT(|)', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Object',
          onlyAggregatable: true,
          onlyTypes: [
            'date',
            'datetime',
            'double',
            'int',
            'string',
            'combobox',
            'currency',
            'DataCategoryGroupReference',
            'email',
            'id',
            'masterrecord',
            'percent',
            'phone',
            'picklist',
            'reference',
            'textarea',
            'url',
          ],
        },
      },
    },
  ]);
});

describe('Code Completion on select fields: SELECT ... FROM XYZ', () => {
  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT | FROM Object', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |FROM Object', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT |FROM Foo', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo, Bar', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id, | FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT id,| FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id,| FROM', sobjectsFieldsFor('Object'));

  // with alias
  validateCompletionsFor('SELECT id,| FROM Foo F', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo F', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo F', [
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
});

describe('Code Completion on nested select fields: SELECT ... FROM XYZ', () => {
  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT | (SELECT bar FROM Bar) FROM Foo', [
    expectKeyword('COUNT()'),
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
    expectKeyword('COUNT()'),
    ...sobjectsFieldsFor('Bar'),
  ]);
  validateCompletionsFor('SELECT foo, (SELECT |, bar FROM Bar) FROM Foo', [
    expectKeyword('COUNT()'),
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
    [expectKeyword('COUNT()'), ...sobjectsFieldsFor('Bar')]
  );
  validateCompletionsFor(
    'SELECT | (SELECT bar, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    [expectKeyword('COUNT()'), ...sobjectsFieldsFor('Foo')]
  );

  validateCompletionsFor('SELECT (SELECT |) FROM Foo', [
    expectKeyword('COUNT()'),
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
    [expectKeyword('COUNT()'), ...sobjectsFieldsFor('Xyz')]
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
    [expectKeyword('COUNT()'), ...sobjectsFieldsFor('Bar')]
  );

  // With a semi-join (SELECT in WHERE clause):
  validateCompletionsFor(
    `SELECT Id, Name, |
      (SELECT Id, Parent.Profile.Name
       FROM SetupEntityAccessItems
       WHERE Parent.ProfileId != null)
    FROM ApexClass
    WHERE Id IN (SELECT SetupEntityId
                   FROM SetupEntityAccess)`,
    sobjectsFieldsFor('ApexClass')
  );
});

describe('Code Completion on SELECT XYZ FROM...', () => {
  validateCompletionsFor('SELECT id FROM |', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id\nFROM |', expectedSObjectCompletions);

  // cursor touching FROM should not complete with Sobject name
  validateCompletionsFor('SELECT id\nFROM|', []);
  validateCompletionsFor('SELECT id FROM |WHERE', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM | WHERE', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM |  WHERE', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM  | WHERE', expectedSObjectCompletions);
  validateCompletionsFor(
    'SELECT id \nFROM |\nWHERE',
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

  validateCompletionsFor('SELECT  FROM | WHERE', expectedSObjectCompletions);
  validateCompletionsFor(
    'SELECT\nFROM |\nWHERE\nORDER BY',
    expectedSObjectCompletions
  );

  describe('Cursor is still touching FROM: it should still complete with fieldnames, and not SObject names', () => {
    validateCompletionsFor('SELECT FROM|', [
      expectKeyword('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);

    validateCompletionsFor('SELECT\nFROM|', [
      expectKeyword('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);
    validateCompletionsFor('SELECT\nFROM|\nWHERE', [
      expectKeyword('COUNT()'),
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
      data: { soqlContext: { sobjectName: 'Account', onlySortable: true } },
    },
    expectKeyword('DISTANCE('),
  ]);
});

describe('Code Completion for GROUP BY', () => {
  validateCompletionsFor('SELECT COUNT(Id) FROM Account GROUP BY |', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account', onlyGroupable: true } },
    },
    ...expectKeywords('ROLLUP', 'CUBE'),
  ]);

  validateCompletionsFor('SELECT id FROM Account GROUP BY id |', [
    ...expectKeywords(
      'FOR',
      'OFFSET',
      'HAVING',
      'LIMIT',
      'ORDER BY',
      'UPDATE TRACKING',
      'UPDATE VIEWSTAT'
    ),
  ]);

  // When there are aggregated fields on SELECT, the GROUP BY clause
  // must include all non-aggregated fields... thus we want completion
  // for those preselected
  validateCompletionsFor('SELECT id FROM Account GROUP BY |', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyGroupable: true,
          mostLikelyItems: ['id'],
        },
      },
    },
    ...expectKeywords('ROLLUP', 'CUBE'),
  ]);
  validateCompletionsFor(
    'SELECT id, MAX(id2), AVG(AnnualRevenue) FROM Account GROUP BY |',
    [
      {
        kind: CompletionItemKind.Field,
        label: '__SOBJECT_FIELDS_PLACEHOLDER',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            onlyGroupable: true,
            mostLikelyItems: ['id'],
          },
        },
      },
      ...expectKeywords('ROLLUP', 'CUBE'),
    ]
  );

  validateCompletionsFor(
    'SELECT ID, Name, MAX(id3), AVG(AnnualRevenue) FROM Account GROUP BY id, |',
    [
      {
        kind: CompletionItemKind.Field,
        label: '__SOBJECT_FIELDS_PLACEHOLDER',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            onlyGroupable: true,
            mostLikelyItems: ['Name'],
          },
        },
      },
      // NOTE: ROLLUP and CUBE not expected unless cursor right after GROUP BY
    ]
  );

  // Expect more than one. Also test with inner queries..
  validateCompletionsFor(
    'SELECT Id, Name, (SELECT Id, Id2, AboutMe FROM User), AVG(AnnualRevenue) FROM Account GROUP BY |',
    [
      {
        kind: CompletionItemKind.Field,
        label: '__SOBJECT_FIELDS_PLACEHOLDER',
        data: {
          soqlContext: {
            sobjectName: 'Account',
            onlyGroupable: true,
            mostLikelyItems: ['Id', 'Name'],
          },
        },
      },
      ...expectKeywords('ROLLUP', 'CUBE'),
    ]
  );
});

describe('Some keyword candidates after FROM clause', () => {
  validateCompletionsFor('SELECT id FROM Account |', [
    expectKeyword('WHERE', { preselect: true }),
    ...expectKeywords(
      'FOR',
      'OFFSET',
      'LIMIT',
      'ORDER BY',
      'GROUP BY',
      'WITH',
      'UPDATE TRACKING',
      'UPDATE VIEWSTAT'
    ),
  ]);

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
    [
      expectKeyword('WHERE', { preselect: true }),
      ...expectKeywords(
        'FOR',
        'OFFSET',
        'LIMIT',
        'ORDER BY',
        'GROUP BY',
        'WITH',
        'UPDATE TRACKING',
        'UPDATE VIEWSTAT'
      ),
    ]
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
      expectKeyword('SELECT'),
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
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: ['double', 'int', 'currency', 'percent'],
        },
      },
    },
  ]);

  // COUNT is treated differently, always worth testing it separately
  validateCompletionsFor('SELECT COUNT(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: [
            'date',
            'datetime',
            'double',
            'int',
            'string',
            'combobox',
            'currency',
            'DataCategoryGroupReference',
            'email',
            'id',
            'masterrecord',
            'percent',
            'phone',
            'picklist',
            'reference',
            'textarea',
            'url',
          ],
        },
      },
    },
  ]);

  validateCompletionsFor('SELECT MAX(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: [
            'date',
            'datetime',
            'double',
            'int',
            'string',
            'time',
            'combobox',
            'currency',
            'DataCategoryGroupReference',
            'email',
            'id',
            'masterrecord',
            'percent',
            'phone',
            'picklist',
            'reference',
            'textarea',
            'url',
          ],
        },
      },
    },
  ]);

  validateCompletionsFor('SELECT AVG(| FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: ['double', 'int', 'currency', 'percent'],
        },
      },
    },
  ]);

  validateCompletionsFor('SELECT AVG(|), Id FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: ['double', 'int', 'currency', 'percent'],
        },
      },
    },
  ]);
  validateCompletionsFor('SELECT Id, AVG(|) FROM Account', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: {
        soqlContext: {
          sobjectName: 'Account',
          onlyAggregatable: true,
          onlyTypes: ['double', 'int', 'currency', 'percent'],
        },
      },
    },
  ]);

  // NOTE: cursor is right BEFORE the function expression:
  validateCompletionsFor('SELECT Id, | SUM(AnnualRevenue) FROM Account', [
    ...sobjectsFieldsFor('Account'),
  ]);
});

describe('Code Completion on "semi-join" (SELECT)', () => {
  validateCompletionsFor(
    'SELECT Id FROM Account WHERE Id IN (SELECT FROM |)',
    expectedSObjectCompletions
  );

  validateCompletionsFor(
    'SELECT Id FROM Account WHERE Id IN (SELECT | FROM Foo)',
    [
      {
        kind: CompletionItemKind.Field,
        label: '__SOBJECT_FIELDS_PLACEHOLDER',
        data: { soqlContext: { sobjectName: 'Foo' } },
      },
      functionCallItem('AVG'),
      functionCallItem('MIN'),
      functionCallItem('MAX'),
      functionCallItem('SUM'),
      functionCallItem('COUNT'),
      functionCallItem('COUNT_DISTINCT'),
      INNER_SELECT_snippet,
    ]
  );

  // NOTE: The SELECT of a semi-join can only have one field, thus
  // we expect no completions here:
  validateCompletionsFor(
    'SELECT Id FROM Account WHERE Id IN (SELECT Id, | FROM Foo)',
    []
  );
});

describe('Special cases around newlines', () => {
  validateCompletionsFor('SELECT id FROM|\n\n\n', []);
  validateCompletionsFor('SELECT id FROM |\n\n', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM\n|', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM\n\n|', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM\n|\n', expectedSObjectCompletions);
  validateCompletionsFor('SELECT id FROM\n\n|\n\n', expectedSObjectCompletions);
  validateCompletionsFor(
    'SELECT id FROM\n\n\n\n\n\n|\n\n',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id FROM\n\n|\n\nWHERE',
    expectedSObjectCompletions
  );
  validateCompletionsFor(
    'SELECT id FROM\n\n|WHERE',
    expectedSObjectCompletions
  );
});

function expectKeyword(
  word: string,
  extraOptions: Partial<CompletionItem> = {}
): CompletionItem {
  return Object.assign(
    {
      kind: CompletionItemKind.Keyword,
      label: word,
      insertText: word,
    },
    extraOptions
  );
}

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
    functionCallItem('AVG'),
    functionCallItem('MIN'),
    functionCallItem('MAX'),
    functionCallItem('SUM'),
    functionCallItem('COUNT'),
    functionCallItem('COUNT_DISTINCT'),
    INNER_SELECT_snippet,
  ];
}
