/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { ModelDeserializer } from './deserializer';
import { ErrorType } from '../model/model';

const testQueryModel = {
  select: {
    selectExpressions: [
      { field: { fieldName: 'field1' } },
      { field: { fieldName: 'field2' } },
      {
        field: { fieldName: 'field3' },
        alias: { unmodeledSyntax: 'alias3', reason: 'unmodeled:alias' },
      },
      {
        unmodeledSyntax: 'COUNT(fieldZ)',
        reason: 'unmodeled:function-reference',
      },
      {
        unmodeledSyntax: '(SELECT fieldA FROM objectA)',
        reason: 'unmodeled:semi-join',
      },
      {
        unmodeledSyntax: 'TYPEOF obj WHEN typeX THEN fieldX ELSE fieldY END',
        reason: 'unmodeled:type-of',
      },
    ],
  },
  from: { sobjectName: 'object1' },
  where: {
    condition: {
      field: { fieldName: 'field1' },
      operator: '=',
      compareValue: { type: 'NUMBER', value: '5' },
    },
  },
  with: {
    unmodeledSyntax: 'WITH DATA CATEGORY cat__c AT val__c',
    reason: 'unmodeled:with',
  },
  groupBy: { unmodeledSyntax: 'GROUP BY field1', reason: 'unmodeled:group-by' },
  orderBy: {
    orderByExpressions: [
      {
        field: { fieldName: 'field2' },
        order: 'DESC',
        nullsOrder: 'NULLS LAST',
      },
      { field: { fieldName: 'field1' } },
    ],
  },
  limit: { limit: 20 },
  offset: { unmodeledSyntax: 'OFFSET 2', reason: 'unmodeled:offset' },
  bind: { unmodeledSyntax: 'BIND field1 = 5', reason: 'unmodeled:bind' },
  recordTrackingType: {
    unmodeledSyntax: 'FOR VIEW',
    reason: 'unmodeled:record-tracking',
  },
  update: { unmodeledSyntax: 'UPDATE TRACKING', reason: 'unmodeled:update' },
  errors: [],
};

const fromWithUnmodeledSyntax = {
  sobjectName: 'object1',
  as: { unmodeledSyntax: 'AS objectAs', reason: 'unmodeled:as' },
  using: {
    unmodeledSyntax: 'USING SCOPE everything',
    reason: 'unmodeled:using',
  },
};

const selectCountUnmdeledSyntax = {
  unmodeledSyntax: 'SELECT COUNT()',
  reason: 'unmodeled:count',
};

const limitZero = { limit: 0 };

const literalTrue = { type: 'BOOLEAN', value: 'TRUE' };
const literalFalse = { type: 'BOOLEAN', value: 'FALSE' };
const literalCurrency = { type: 'CURRENCY', value: 'USD1000' };
const literalDate = { type: 'DATE', value: '2020-11-11' };
const literalNull = { type: 'NULL', value: 'null' };
const literalNumber = { type: 'NUMBER', value: '5' };
const literalString = { type: 'STRING', value: "'HelloWorld'" };

const field = { fieldName: 'field' };

const conditionFieldCompare = {
  field,
  operator: '=',
  compareValue: literalNumber,
};
const conditionLike = { field, operator: 'LIKE', compareValue: literalString };
const conditionInList = {
  field,
  operator: 'IN',
  values: [literalString, { ...literalString, value: "'other value'" }],
};
const conditionIncludes = {
  field,
  operator: 'INCLUDES',
  values: [literalString, { ...literalString, value: "'other value'" }],
};
const conditionAndOr = {
  leftCondition: conditionFieldCompare,
  andOr: 'AND',
  rightCondition: conditionLike,
};
const conditionNested = { condition: conditionFieldCompare };
const conditionNot = { condition: conditionFieldCompare };
const conditionCalculated = {
  unmodeledSyntax: 'A + B > 10',
  reason: 'unmodeled:calculated-condition',
};
const conditionDistance = {
  unmodeledSyntax: "DISTANCE(field,GEOLOCATION(37,122),'mi') < 100",
  reason: 'unmodeled:distance-condition',
};
const conditionSemiJoin = {
  unmodeledSyntax: 'field IN (SELECT A FROM B)',
  reason: 'unmodeled:in-semi-join-condition',
};

describe('ModelDeserializer should', () => {
  it('model supported syntax as query objects', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0],
          testQueryModel.select.selectExpressions[1],
        ],
      },
      from: testQueryModel.from,
      errors: testQueryModel.errors,
    };
    const actual = new ModelDeserializer(
      'SELECT field1, field2 FROM object1'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('model AS and USING FROM syntax as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0],
          testQueryModel.select.selectExpressions[1],
        ],
      },
      from: fromWithUnmodeledSyntax,
      errors: testQueryModel.errors,
    };
    const actual = new ModelDeserializer(
      'SELECT field1, field2 FROM object1 AS objectAs USING SCOPE everything'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('model functions, inner queries, TYPEOF, and aliases in SELECT clause as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0],
          testQueryModel.select.selectExpressions[1],
          testQueryModel.select.selectExpressions[2],
          testQueryModel.select.selectExpressions[3],
          testQueryModel.select.selectExpressions[4],
          testQueryModel.select.selectExpressions[5],
        ],
      },
      from: testQueryModel.from,
      errors: testQueryModel.errors,
    };
    const actual = new ModelDeserializer(
      'SELECT field1, field2, field3 alias3, COUNT(fieldZ), (SELECT fieldA FROM objectA), TYPEOF obj WHEN typeX THEN fieldX ELSE fieldY END FROM object1'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('model COUNT() in SELECT clause as unmodeled syntax', () => {
    const expected = {
      select: selectCountUnmdeledSyntax,
      from: testQueryModel.from,
      errors: testQueryModel.errors,
    };
    const actual = new ModelDeserializer(
      'SELECT COUNT() FROM object1'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('model all unmodeled clauses as unmodeled syntax', () => {
    const expected = testQueryModel;
    const actual = new ModelDeserializer(
      'SELECT field1, field2, field3 alias3, COUNT(fieldZ), (SELECT fieldA FROM objectA), TYPEOF obj WHEN typeX THEN fieldX ELSE fieldY END FROM object1 ' +
        'WHERE field1 = 5 WITH DATA CATEGORY cat__c AT val__c GROUP BY field1 ORDER BY field2 DESC NULLS LAST, field1 LIMIT 20 OFFSET 2 BIND field1 = 5 FOR VIEW UPDATE TRACKING'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('model parse errors with partial parse results as ModelErrors within query', () => {
    const expectedErrors = 1;
    const model = new ModelDeserializer('SELECT FROM object1').deserialize();
    expect(model.errors).toBeDefined();
    expect(model.errors?.length).toEqual(expectedErrors);
  });

  it('identify no selections error', () => {
    expectError('SELECT FROM object1', ErrorType.NOSELECTIONS);
  });

  it('identify no SELECT clause error', () => {
    expectError('FROM object1', ErrorType.NOSELECT);
  });

  it('identify incomplete FROM clause error', () => {
    expectError('SELECT A FROM ', ErrorType.INCOMPLETEFROM);
  });

  it('identify no FROM clause error', () => {
    expectError('SELECT A', ErrorType.NOFROM);
  });

  it('identify empty statement error', () => {
    expectError('', ErrorType.EMPTY);
  });

  it('identify incomplete LIMIT clause error when number missing', () => {
    expectError('SELECT A FROM B LIMIT', ErrorType.INCOMPLETELIMIT);
  });

  it('identify incomplete LIMIT clause error when value is not a number', () => {
    expectError('SELECT A FROM B LIMIT X', ErrorType.INCOMPLETELIMIT);
  });

  it('identify LIMIT 0 as valid limit clause', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      limit: limitZero,
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 LIMIT 0'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify string literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalString },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field = 'HelloWorld'"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify date literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalDate },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = 2020-11-11'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify TRUE literal in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalTrue },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = TRUE'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify FALSE literal in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalFalse },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = FALSE'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify number literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalNumber },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify null literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalNull },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = null'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify currency literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: {
        condition: { ...conditionFieldCompare, compareValue: literalCurrency },
      },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = USD1000'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify = operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '=' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field = 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify != operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '!=' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field != 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify <> operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<>' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field <> 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify < operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field < 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify > operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '>' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field > 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify <= operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<=' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field <= 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify >= operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '>=' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field >= 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify LIKE operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionLike },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field LIKE 'HelloWorld'"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify INCLUDES operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionIncludes, operator: 'INCLUDES' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field INCLUDES ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify EXCLUDES operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionIncludes, operator: 'EXCLUDES' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field EXCLUDES ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify IN operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionInList, operator: 'IN' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field IN ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify NOT IN operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionInList, operator: 'NOT IN' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field NOT IN ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify includes condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionIncludes },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field INCLUDES ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify in-list condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionInList },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field IN ( 'HelloWorld', 'other value' )"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify calculated condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionCalculated },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE A + B > 10'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify distance condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionDistance },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE DISTANCE(field,GEOLOCATION(37,122),'mi') < 100"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify IN semi-join condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionSemiJoin },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE field IN (SELECT A FROM B)'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify NOT operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionNot },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE NOT field = 5'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify AND operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionAndOr, andOr: 'AND' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field = 5 AND field LIKE 'HelloWorld'"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify OR operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionAndOr, andOr: 'OR' } },
      errors: [],
    };
    const actual = new ModelDeserializer(
      "SELECT field1 FROM object1 WHERE field = 5 OR field LIKE 'HelloWorld'"
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify nested conditions', () => {
    const expected = {
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      where: { condition: conditionNested },
      errors: [],
    };
    const actual = new ModelDeserializer(
      'SELECT field1 FROM object1 WHERE ( field = 5 )'
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify empty WHERE', () => {
    expectError('SELECT field1 FROM object1 WHERE', ErrorType.EMPTYWHERE);
  });

  it('identify incomplete nested WHERE condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE ( field = 5',
      ErrorType.INCOMPLETENESTEDCONDITION
    );
  });

  it('identify incomplete AND/OR condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE field = 5 AND',
      ErrorType.INCOMPLETEANDORCONDITION
    );
    expectError(
      'SELECT field1 FROM object1 WHERE OR field = 5',
      ErrorType.INCOMPLETEANDORCONDITION
    );
  });

  it('identify incomplete NOT condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE NOT',
      ErrorType.INCOMPLETENOTCONDITION
    );
  });

  it('identify unrecognized literal value in condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE field = foo',
      ErrorType.UNRECOGNIZEDCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field LIKE foo',
      ErrorType.UNRECOGNIZEDCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field IN ( foo )',
      ErrorType.UNRECOGNIZEDCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field INCLUDES ( foo )',
      ErrorType.UNRECOGNIZEDCOMPAREVALUE
    );
  });

  it('identify unrecognized compare operator in condition', () => {
    expectError(
      "SELECT field1 FROM object1 WHERE field LIK 'foo'",
      ErrorType.UNRECOGNIZEDCOMPAREOPERATOR
    );
  });

  it('identify unrecognized compare field in condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE 5 = 5',
      ErrorType.UNRECOGNIZEDCOMPAREFIELD
    );
  });

  it('identify missing compare value in condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE field =',
      ErrorType.NOCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field LIKE',
      ErrorType.NOCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field IN',
      ErrorType.NOCOMPAREVALUE
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field INCLUDES',
      ErrorType.NOCOMPAREVALUE
    );
  });

  it('identify missing compare operator in condition', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE field',
      ErrorType.NOCOMPAREOPERATOR
    );
  });

  it('identify incomplete multi-value list', () => {
    expectError(
      'SELECT field1 FROM object1 WHERE field IN (',
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field IN ( 'foo'",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field IN ( 'foo',",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field IN ( 'foo', )",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      'SELECT field1 FROM object1 WHERE field INCLUDES (',
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field INCLUDES ( 'foo'",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field INCLUDES ( 'foo',",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
    expectError(
      "SELECT field1 FROM object1 WHERE field INCLUDES ( 'foo', )",
      ErrorType.INCOMPLETEMULTIVALUELIST
    );
  });

  it('Identify comments at the top of the file', () => {
    const expected = {
      headerComments: {
        text:
          '// This is a comment on line 1\n// This is a comment on line 2\n',
      },
      select: {
        selectExpressions: [testQueryModel.select.selectExpressions[0]],
      },
      from: testQueryModel.from,
      errors: [],
    };
    const actual = new ModelDeserializer(
      `// This is a comment on line 1\n// This is a comment on line 2\nSELECT field1 FROM object1`
    ).deserialize();
    expect(actual).toEqual(expected);
  });

  it('Identify comments at the top of the file, with parse errors', () => {
    const expected = {
      headerComments: {
        text:
          '// This is a comment on line 1\n// This is a comment on line 2\n',
      },
    };
    const actual = new ModelDeserializer(
      `// This is a comment on line 1\n// This is a comment on line 2\nSELECT FROM object1`
    ).deserialize();

    expect(actual.errors).toBeDefined();
    expect(actual.errors?.length).toEqual(1);
    expect(actual.errors && actual.errors[0].lineNumber).toEqual(3);
    expect(actual.headerComments).toEqual(expected.headerComments);
  });

  function expectError(query: string, expectedType: ErrorType): void {
    const model = new ModelDeserializer(query).deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  }
});
