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
import {
  soqlDateRangeLiterals,
  soqlParametricDateRangeLiterals,
} from './completion/soql-functions';

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

const typesForLT_GT_operators = [
  'anyType',
  'complexvalue',
  'currency',
  'date',
  'datetime',
  'double',
  'int',
  'percent',
  'string',
  'textarea',
  'time',
  'url',
];
const expectedSoqlContextByKeyword: {
  [key: string]: Partial<SoqlItemContext>;
} = {
  '<': { onlyTypes: typesForLT_GT_operators },
  '<=': { onlyTypes: typesForLT_GT_operators },
  '>': { onlyTypes: typesForLT_GT_operators },
  '>=': { onlyTypes: typesForLT_GT_operators },
  'INCLUDES (': { onlyTypes: ['multipicklist'] },
  'EXCLUDES (': { onlyTypes: ['multipicklist'] },
  LIKE: { onlyTypes: ['string', 'textarea', 'time'] },
};

function newLiteralItem(
  soqlItemContext: SoqlItemContext,
  kind: CompletionItemKind,
  label: string,
  extraOptions: Partial<CompletionItem> = {}
): CompletionItem {
  return {
    label: label,
    kind: kind,
    ...extraOptions,
    data: {
      soqlContext: soqlItemContext,
    },
  };
}
function expectedItemsForLiterals(
  soqlContext: SoqlItemContext,
  nillableOperator: boolean
): CompletionItem[] {
  const items: CompletionItem[] = [
    newLiteralItem(
      soqlContext,
      CompletionItemKind.Constant,
      '__LITERAL_VALUES_FOR_FIELD'
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['boolean'] } },
      CompletionItemKind.Value,
      'TRUE'
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['boolean'] } },
      CompletionItemKind.Value,
      'FALSE'
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['int'] } },
      CompletionItemKind.Snippet,
      'nnn',
      { insertText: '${1:123}', insertTextFormat: InsertTextFormat.Snippet }
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['double'] } },
      CompletionItemKind.Snippet,
      'nnn.nnn',
      { insertText: '${1:123.456}', insertTextFormat: InsertTextFormat.Snippet }
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['currency'] } },
      CompletionItemKind.Snippet,
      'ISOCODEnnn.nn',
      {
        insertText: '${1|USD,EUR,JPY,CNY,CHF|}${2:999.99}',
        insertTextFormat: InsertTextFormat.Snippet,
      }
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['string'] } },
      CompletionItemKind.Snippet,
      'abc123',
      {
        insertText: "'${1:abc123}'",
        insertTextFormat: InsertTextFormat.Snippet,
      }
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['date'] } },
      CompletionItemKind.Snippet,
      'YYYY-MM-DD',
      {
        insertText:
          '${1:${CURRENT_YEAR}}-${2:${CURRENT_MONTH}}-${3:${CURRENT_DATE}}$0',
        insertTextFormat: InsertTextFormat.Snippet,
        preselect: true,
        sortText: ' YYYY-MM-DD',
      }
    ),
    newLiteralItem(
      { ...soqlContext, ...{ onlyTypes: ['datetime'] } },
      CompletionItemKind.Snippet,
      'YYYY-MM-DDThh:mm:ssZ',
      {
        insertText:
          '${1:${CURRENT_YEAR}}-${2:${CURRENT_MONTH}}-${3:${CURRENT_DATE}}T${4:${CURRENT_HOUR}}:${5:${CURRENT_MINUTE}}:${6:${CURRENT_SECOND}}Z$0',
        insertTextFormat: InsertTextFormat.Snippet,
        preselect: true,
        sortText: ' YYYY-MM-DDThh:mm:ssZ',
      }
    ),
    ...soqlDateRangeLiterals.map((k) =>
      newLiteralItem(
        { ...soqlContext, ...{ onlyTypes: ['date', 'datetime'] } },
        CompletionItemKind.Value,
        k
      )
    ),
    ...soqlParametricDateRangeLiterals.map((k) =>
      newLiteralItem(
        { ...soqlContext, ...{ onlyTypes: ['date', 'datetime'] } },
        CompletionItemKind.Snippet,
        k,
        {
          insertText: k.replace(':n', ':${1:nn}') + '$0',
          insertTextFormat: InsertTextFormat.Snippet,
        }
      )
    ),
  ];

  if (nillableOperator) {
    items.push(
      newLiteralItem(
        { ...soqlContext, ...{ onlyNillable: true } },
        CompletionItemKind.Keyword,
        'NULL'
      )
    );
  }

  return items;
}

function newKeywordItem(
  word: string,
  extraOptions: Partial<CompletionItem> = {}
): CompletionItem {
  return Object.assign(
    {
      kind: CompletionItemKind.Keyword,
      label: word,
    },
    extraOptions
  );
}

function newKeywordItems(...words: string[]): CompletionItem[] {
  return words.map((s) => ({
    kind: CompletionItemKind.Keyword,
    label: s,
  }));
}

function newKeywordItemsWithContext(
  sobjectName: string,
  fieldName: string,
  words: string[]
): CompletionItem[] {
  return words.map((s) => ({
    kind: CompletionItemKind.Keyword,
    label: s,
    data: {
      soqlContext: {
        sobjectName: sobjectName,
        fieldName: fieldName,
        ...expectedSoqlContextByKeyword[s],
      },
    },
  }));
}

function newFunctionCallItem(name: string, soqlItemContext?: SoqlItemContext) {
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
  validateCompletionsFor('|', [newKeywordItem('SELECT'), SELECT_snippet]);
  validateCompletionsFor('SELE|', [
    ...newKeywordItems('SELECT'),
    SELECT_snippet,
  ]);
  validateCompletionsFor('| FROM', newKeywordItems('SELECT'));
  validateCompletionsFor('SELECT|', []);

  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT |', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n|', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n |', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT\n\n |\n\n', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id, |', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id, boo,|', sobjectsFieldsFor('Object'));
  validateCompletionsFor('SELECT id|', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT id |', newKeywordItems('FROM'));
  validateCompletionsFor('SELECT COUNT() |', newKeywordItems('FROM'));
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
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |FROM Object', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Object'),
  ]);
  validateCompletionsFor('SELECT |FROM Foo', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT | FROM Foo, Bar', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id, | FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT id,| FROM Foo', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT id,| FROM', sobjectsFieldsFor('Object'));

  // with alias
  validateCompletionsFor('SELECT id,| FROM Foo F', sobjectsFieldsFor('Foo'));
  validateCompletionsFor('SELECT |, id FROM Foo F', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
  validateCompletionsFor('SELECT |, id, FROM Foo F', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Foo'),
  ]);
});

describe('Code Completion on nested select fields: SELECT ... FROM XYZ', () => {
  // "COUNT()" can only be used on its own, unlike "COUNT(fieldName)".
  // So we expect it on completions only right after "SELECT"
  validateCompletionsFor('SELECT | (SELECT bar FROM Bar) FROM Foo', [
    newKeywordItem('COUNT()'),
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
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Bar'),
  ]);
  validateCompletionsFor('SELECT foo, (SELECT |, bar FROM Bar) FROM Foo', [
    newKeywordItem('COUNT()'),
    ...sobjectsFieldsFor('Bar'),
  ]);
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, | FROM Bar) FROM Foo',
    sobjectsFieldsFor('Bar')
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT bar, (SELECT | FROM XYZ) FROM Bar) FROM Foo',
    [...newKeywordItems('COUNT()'), ...sobjectsFieldsFor('XYZ')]
  );
  validateCompletionsFor(
    'SELECT foo, (SELECT |, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    [newKeywordItem('COUNT()'), ...sobjectsFieldsFor('Bar')]
  );
  validateCompletionsFor(
    'SELECT | (SELECT bar, (SELECT xyz FROM XYZ) FROM Bar) FROM Foo',
    [newKeywordItem('COUNT()'), ...sobjectsFieldsFor('Foo')]
  );

  validateCompletionsFor('SELECT (SELECT |) FROM Foo', [
    newKeywordItem('COUNT()'),
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

  validateCompletionsFor('SELECT foo, ( | FROM Foo', newKeywordItems('SELECT'));
  validateCompletionsFor('SELECT foo, ( |FROM Foo', newKeywordItems('SELECT'));
  validateCompletionsFor('SELECT foo, (| FROM Foo', newKeywordItems('SELECT'));
  validateCompletionsFor(
    'SELECT foo, (|    FROM Foo',
    newKeywordItems('SELECT')
  );

  validateCompletionsFor(
    'SELECT foo, (|) FROM Foo',
    newKeywordItems('SELECT').concat(SELECT_snippet)
  );

  validateCompletionsFor(
    'SELECT foo, (SELECT bar FROM Bar), (SELECT | FROM Xyz) FROM Foo',
    [newKeywordItem('COUNT()'), ...sobjectsFieldsFor('Xyz')]
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
    [newKeywordItem('COUNT()'), ...sobjectsFieldsFor('Bar')]
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
      newKeywordItem('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);

    validateCompletionsFor('SELECT\nFROM|', [
      newKeywordItem('COUNT()'),
      ...sobjectsFieldsFor('Object'),
    ]);
    validateCompletionsFor('SELECT\nFROM|\nWHERE', [
      newKeywordItem('COUNT()'),
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
    newKeywordItem('DISTANCE('),
  ]);
});

describe('Code Completion for GROUP BY', () => {
  validateCompletionsFor('SELECT COUNT(Id) FROM Account GROUP BY |', [
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account', onlyGroupable: true } },
    },
    ...newKeywordItems('ROLLUP', 'CUBE'),
  ]);

  validateCompletionsFor('SELECT id FROM Account GROUP BY id |', [
    ...newKeywordItems(
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
    ...newKeywordItems('ROLLUP', 'CUBE'),
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
      ...newKeywordItems('ROLLUP', 'CUBE'),
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
      ...newKeywordItems('ROLLUP', 'CUBE'),
    ]
  );
});

describe('Some keyword candidates after FROM clause', () => {
  validateCompletionsFor('SELECT id FROM Account |', [
    newKeywordItem('WHERE', { preselect: true }),
    ...newKeywordItems(
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
    newKeywordItems('VIEW', 'REFERENCE')
  );

  validateCompletionsFor(
    'SELECT id FROM Account WITH |',
    newKeywordItems('DATA CATEGORY')
  );

  validateCompletionsFor(
    'SELECT Account.Name, (SELECT FirstName, LastName FROM Contacts |) FROM Account',
    [
      newKeywordItem('WHERE', { preselect: true }),
      ...newKeywordItems(
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
    ...newKeywordItems('DISTANCE(', 'NOT'),
    {
      kind: CompletionItemKind.Field,
      label: '__SOBJECT_FIELDS_PLACEHOLDER',
      data: { soqlContext: { sobjectName: 'Account' } },
    },
  ]);
  validateCompletionsFor('SELECT id FROM Account WHERE Name |', [
    ...newKeywordItems('IN (', 'NOT IN (', '=', '!=', '<>'),
    ...newKeywordItemsWithContext('Account', 'Name', [
      'INCLUDES (',
      'EXCLUDES (',
      '<',
      '<=',
      '>',
      '>=',
      'LIKE',
    ]),
  ]);

  validateCompletionsFor('SELECT id FROM Account WHERE Type IN (|', [
    ...newKeywordItems('SELECT'),
    SELECT_snippet,
    ...expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Type',
      },
      true
    ),
  ]);

  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type IN ('Customer', |)",
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Type',
      },
      true
    )
  );
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type IN (|, 'Customer')",
    [
      ...newKeywordItems('SELECT'),
      SELECT_snippet,
      ...expectedItemsForLiterals(
        {
          sobjectName: 'Account',
          fieldName: 'Type',
        },
        true
      ),
    ]
  );

  // NOTE: Unlike IN(), INCLUDES()/EXCLUDES() never support NULL in the list
  validateCompletionsFor(
    'SELECT Channel FROM QuickText WHERE Channel INCLUDES (|',
    expectedItemsForLiterals(
      {
        sobjectName: 'QuickText',
        fieldName: 'Channel',
      },
      false
    )
  );

  validateCompletionsFor(
    "SELECT Channel FROM QuickText WHERE Channel EXCLUDES('Email', |",
    expectedItemsForLiterals(
      {
        sobjectName: 'QuickText',
        fieldName: 'Channel',
      },
      false
    )
  );
  validateCompletionsFor(
    'SELECT id FROM Account WHERE Type = |',
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Type',
      },
      true
    )
  );
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type = 'Boo' OR Name = |",
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Name',
      },
      true
    )
  );
  validateCompletionsFor(
    "SELECT id FROM Account WHERE Type = 'Boo' OR Name LIKE |",
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Name',
      },
      false
    )
  );
  validateCompletionsFor(
    'SELECT id FROM Account WHERE Account.Type = |',
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'Type',
      },
      true
    )
  );

  validateCompletionsFor(
    `SELECT Name FROM Account WHERE LastActivityDate < |`,
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'LastActivityDate',
      },
      false
    )
  );
  validateCompletionsFor(
    `SELECT Name FROM Account WHERE LastActivityDate > |`,
    expectedItemsForLiterals(
      {
        sobjectName: 'Account',
        fieldName: 'LastActivityDate',
      },
      false
    )
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
      newFunctionCallItem('AVG'),
      newFunctionCallItem('MIN'),
      newFunctionCallItem('MAX'),
      newFunctionCallItem('SUM'),
      newFunctionCallItem('COUNT'),
      newFunctionCallItem('COUNT_DISTINCT'),
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
    ...newKeywordItems('TYPEOF', 'DISTANCE('),
    newFunctionCallItem('AVG'),
    newFunctionCallItem('MIN'),
    newFunctionCallItem('MAX'),
    newFunctionCallItem('SUM'),
    newFunctionCallItem('COUNT'),
    newFunctionCallItem('COUNT_DISTINCT'),
    INNER_SELECT_snippet,
  ];
}
