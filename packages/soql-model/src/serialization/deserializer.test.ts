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
      { field: { fieldName: 'field3' }, alias: { unmodeledSyntax: 'alias3' } },
      { unmodeledSyntax: 'COUNT(fieldZ)' },
      { unmodeledSyntax: '(SELECT fieldA FROM objectA)' },
      { unmodeledSyntax: 'TYPEOF obj WHEN typeX THEN fieldX ELSE fieldY END' },
    ],
  },
  from: { sobjectName: 'object1' },
  where: { condition: { field: { fieldName: 'field1' }, operator: '=', compareValue: { type: 'NUMBER', value: '5' } } },
  with: { unmodeledSyntax: 'WITH DATA CATEGORY cat__c AT val__c' },
  groupBy: { unmodeledSyntax: 'GROUP BY field1' },
  orderBy: {
    orderByExpressions: [
      { field: { fieldName: 'field2' }, order: 'DESC', nullsOrder: 'NULLS LAST' },
      { field: { fieldName: 'field1' } }
    ]
  },
  limit: { limit: 20 },
  offset: { unmodeledSyntax: 'OFFSET 2' },
  bind: { unmodeledSyntax: 'BIND field1 = 5' },
  recordTrackingType: { unmodeledSyntax: 'FOR VIEW' },
  update: { unmodeledSyntax: 'UPDATE TRACKING' },
  errors: [],
};

const fromWithUnmodeledSyntax = {
  sobjectName: 'object1',
  as: { unmodeledSyntax: 'AS objectAs' },
  using: { unmodeledSyntax: 'USING SCOPE everything' },
};

const selectCountUnmdeledSyntax = { unmodeledSyntax: 'SELECT COUNT()' };

const limitZero = { limit: 0 };

const literalTrue = { type: 'BOOLEAN', value: 'TRUE' };
const literalFalse = { type: 'BOOLEAN', value: 'FALSE' };
const literalCurrency = { type: 'CURRENCY', value: 'USD1000' };
const literalDate = { type: 'DATE', value: '2020-11-11' };
const literalNull = { type: 'NULL', value: 'null' };
const literalNumber = { type: 'NUMBER', value: '5' };
const literalString = { type: 'STRING', value: "'HelloWorld'" };

const field = { fieldName: 'field' };

const conditionFieldCompare = { field, operator: '=', compareValue: literalNumber };
const conditionLike = { field, compareValue: literalString };
const conditionInList = { unmodeledSyntax: "field IN ( 'HelloWorld', 'other value' )" }
const conditionIncludes = { unmodeledSyntax: "field INCLUDES ( 'HelloWorld', 'other value' )" }
// uncomment when in-list conditions are supported----const conditionInList = { field, operator: 'IN', values: [literalString, { ...literalString, value: "'other value'" }] };
// uncomment when includes conditions are supported---const conditionIncludes = { field, operator: 'INCLUDES', values: [literalString, { ...literalString, value: "'other value'" }] };
const conditionAndOr = { leftCondition: conditionFieldCompare, andOr: 'AND', rightCondition: conditionLike };
const conditionNested = { condition: conditionFieldCompare };
const conditionNot = { condition: conditionFieldCompare };
const conditionCalculated = { unmodeledSyntax: 'A + B > 10' };
const conditionDistance = { unmodeledSyntax: "DISTANCE(field,GEOLOCATION(37,122),'mi') < 100" };
const conditionSemiJoin = { unmodeledSyntax: 'field IN (SELECT A FROM B)' };

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
    const expectedType = ErrorType.NOSELECTIONS;
    const model = new ModelDeserializer('SELECT FROM object1').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify no SELECT clause error', () => {
    const expectedType = ErrorType.NOSELECT;
    const model = new ModelDeserializer('FROM object1').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify incomplete FROM clause error', () => {
    const expectedType = ErrorType.INCOMPLETEFROM;
    const model = new ModelDeserializer('SELECT A FROM ').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify no FROM clause error', () => {
    const expectedType = ErrorType.NOFROM;
    const model = new ModelDeserializer('SELECT A').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify empty statement error', () => {
    const expectedType = ErrorType.EMPTY;
    const model = new ModelDeserializer('').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify incomplete LIMIT clause error when number missing', () => {
    const expectedType = ErrorType.INCOMPLETELIMIT;
    const model = new ModelDeserializer('SELECT A FROM B LIMIT').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify incomplete LIMIT clause error when value is not a number', () => {
    const expectedType = ErrorType.INCOMPLETELIMIT;
    const model = new ModelDeserializer('SELECT A FROM B LIMIT X').deserialize();
    if (model.errors && model.errors.length === 1) {
      expect(model.errors[0].type).toEqual(expectedType);
    } else {
      fail();
    }
  });

  it('identify LIMIT 0 as valid limit clause', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ],
      },
      from: testQueryModel.from,
      limit: limitZero,
      errors: [],
    };
    const actual = new ModelDeserializer('SELECT field1 FROM object1 LIMIT 0').deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify string literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalString } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 'HelloWorld'").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify date literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalDate } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 2020-11-11").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify TRUE literal in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalTrue } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = TRUE").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify FALSE literal in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalFalse } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = FALSE").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify number literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalNumber } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify null literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalNull } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = null").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify currency literals in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, compareValue: literalCurrency } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = USD1000").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify = operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '=' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify != operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '!=' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field != 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify <> operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<>' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field <> 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify < operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field < 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify > operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '>' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field > 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify <= operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '<=' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field <= 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify >= operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionFieldCompare, operator: '>=' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field >= 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify LIKE operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionLike },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field LIKE 'HelloWorld'").deserialize();
    expect(actual).toEqual(expected);
  });

  /* UNCOMMENT WHEN INCLUDES CONDITIONS ARE SUPPORTED */
  // it('identify INCLUDES operator in condition', () => {
  //   const expected = {
  //     select: {
  //       selectExpressions: [
  //         testQueryModel.select.selectExpressions[0]
  //       ]
  //     },
  //     from: testQueryModel.from,
  //     where: { condition: { ...conditionIncludes, operator: 'INCLUDES' } },
  //     errors: []
  //   };
  //   const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field INCLUDES ( 'HelloWorld', 'other value' )").deserialize();
  //   expect(actual).toEqual(expected);
  // });

  /* UNCOMMENT WHEN INCLUDES CONDITIONS ARE SUPPORTED */
  // it('identify EXCLUDES operator in condition', () => {
  //   const expected = {
  //     select: {
  //       selectExpressions: [
  //         testQueryModel.select.selectExpressions[0]
  //       ]
  //     },
  //     from: testQueryModel.from,
  //     where: { condition: { ...conditionIncludes, operator: 'EXCLUDES' } },
  //     errors: []
  //   };
  //   const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field EXCLUDES ( 'HelloWorld', 'other value' )").deserialize();
  //   expect(actual).toEqual(expected);
  // });

  /* UNCOMMENT WHEN IN-LIST CONDITIONS ARE SUPPORTED */
  // it('identify IN operator in condition', () => {
  //   const expected = {
  //     select: {
  //       selectExpressions: [
  //         testQueryModel.select.selectExpressions[0]
  //       ]
  //     },
  //     from: testQueryModel.from,
  //     where: { condition: { ...conditionInList, operator: 'IN' } },
  //     errors: []
  //   };
  //   const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field IN ( 'HelloWorld', 'other value' )").deserialize();
  //   expect(actual).toEqual(expected);
  // });

  /* UNCOMMENT WHEN IN-LIST CONDITIONS ARE SUPPORTED */
  // it('identify NOT IN operator in condition', () => {
  //   const expected = {
  //     select: {
  //       selectExpressions: [
  //         testQueryModel.select.selectExpressions[0]
  //       ]
  //     },
  //     from: testQueryModel.from,
  //     where: { condition: { ...conditionInList, operator: 'NOT IN' } },
  //     errors: []
  //   };
  //   const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field NOT IN ( 'HelloWorld', 'other value' )").deserialize();
  //   expect(actual).toEqual(expected);
  // });

  it('identify includes condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionIncludes },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field INCLUDES ( 'HelloWorld', 'other value' )").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify in-list condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionInList },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field IN ( 'HelloWorld', 'other value' )").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify calculated condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionCalculated },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE A + B > 10").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify distance condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionDistance },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE DISTANCE(field,GEOLOCATION(37,122),'mi') < 100").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify IN semi-join condition as unmodeled syntax', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionSemiJoin },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field IN (SELECT A FROM B)").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify NOT operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionNot },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE NOT field = 5").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify AND operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionAndOr, andOr: 'AND' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 5 AND field LIKE 'HelloWorld'").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify OR operator in condition', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: { ...conditionAndOr, andOr: 'OR' } },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE field = 5 OR field LIKE 'HelloWorld'").deserialize();
    expect(actual).toEqual(expected);
  });

  it('identify nested conditions', () => {
    const expected = {
      select: {
        selectExpressions: [
          testQueryModel.select.selectExpressions[0]
        ]
      },
      from: testQueryModel.from,
      where: { condition: conditionNested },
      errors: []
    };
    const actual = new ModelDeserializer("SELECT field1 FROM object1 WHERE ( field = 5 )").deserialize();
    expect(actual).toEqual(expected);
  });
});
