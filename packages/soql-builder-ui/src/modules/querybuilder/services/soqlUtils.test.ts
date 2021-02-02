/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Soql } from '@salesforce/soql-model';
import {
  convertUiModelToSoql,
  convertSoqlToUiModel,
  soqlStringLiteralToDisplayValue,
  displayValueToSoqlStringLiteral
} from './soqlUtils';
import { ToolingModelJson } from './model';

describe('SoqlUtils', () => {
  const uiModelOne: ToolingModelJson = {
    sObject: 'Account',
    fields: ['Name', 'Id'],
    where: {
      conditions: [
        {
          condition: {
            field: { fieldName: 'Name' },
            operator: '=',
            compareValue: {
              type: 'STRING',
              value: "'pwt'"
            }
          },
          index: 0
        },
        {
          condition: {
            field: { fieldName: 'Id' },
            operator: '=',
            compareValue: {
              type: 'NUMBER',
              value: "123456"
            }
          },
          index: 1
        }
      ],
      andOr: 'AND'
    },
    orderBy: [{ field: 'Name', order: 'ASC', nulls: 'NULLS FIRST' }],
    limit: '11',
    errors: [],
    unsupported: [],
    originalSoqlStatement: ''
  };
  const uiModelErrors: ToolingModelJson = {
    sObject: 'Account',
    fields: ['Name'],
    orderBy: [],
    limit: '',
    errors: [
      {
        type: 'UNKNOWN'
      }
    ],
    where: { conditions: [], andOr: undefined },
    unsupported: [
      {
        unmodeledSyntax: 'GROUP BY',
        reason: Soql.REASON_UNMODELED_GROUPBY
      }
    ],
    originalSoqlStatement: ''
  };
  const soqlOne =
    "Select Name, Id from Account WHERE Name = 'pwt' AND Id = 123456 ORDER BY Name ASC NULLS FIRST LIMIT 11";
  const unsupportedWhereExpr =
    "Select Name, Id from Account WHERE (Name = 'pwt' AND Id = 123456) OR Id = 654321 ORDER BY Name ASC NULLS FIRST LIMIT 11";
  const soqlError = 'Select Name from Account GROUP BY';
  it('transform UI Model to Soql', () => {
    const transformedSoql = convertUiModelToSoql(uiModelOne);
    expect(transformedSoql).toContain(uiModelOne.fields[0]);
    expect(transformedSoql).toContain(uiModelOne.fields[1]);
    expect(transformedSoql).toContain(uiModelOne.sObject);
    expect(transformedSoql).toContain(
      uiModelOne.where.conditions[0].condition.compareValue.value
    );
    expect(transformedSoql).toContain(
      uiModelOne.where.conditions[1].condition.compareValue.value
    );
    expect(transformedSoql).toContain(uiModelOne.where.andOr);
    expect(transformedSoql).toContain('=');
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].field);
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].order);
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].nulls);
    expect(transformedSoql).toContain('11');
  });
  it('transform UI Model to Soql but leaves out errors/unsupported', () => {
    const transformedSoql = convertUiModelToSoql(uiModelErrors);
    expect(transformedSoql).not.toContain(
      uiModelErrors.unsupported[0].unmodeledSyntax
    );
    expect(transformedSoql).not.toContain(uiModelErrors.errors[0].type);
  });
  it('transforms Soql to UI Model', () => {
    const transformedUiModel = convertSoqlToUiModel(soqlOne);
    let expectedUiModel = { ...uiModelOne } as any;
    delete expectedUiModel.originalSoqlStatement;
    expect(JSON.stringify(transformedUiModel)).toEqual(
      JSON.stringify(expectedUiModel)
    );
  });

  it('catches unsupported syntyax in where', () => {
    const transformedUiModel = convertSoqlToUiModel(unsupportedWhereExpr);
    expect(transformedUiModel.where.conditions.length).toBe(0);
    expect(transformedUiModel.unsupported.length).toBe(1);
    expect(transformedUiModel.unsupported[0].reason).toEqual(
      Soql.REASON_UNMODELED_COMPLEXGROUP
    );
  });

  it('transforms Soql to UI Model with errors in soql syntax', () => {
    const transformedUiModel = convertSoqlToUiModel(soqlError);
    expect(transformedUiModel.errors[0].type).toEqual(
      uiModelErrors.errors[0].type
    );
    expect(transformedUiModel.unsupported[0].reason).toEqual(
      uiModelErrors.unsupported[0].reason
    );
  });

  describe('soqlStringLiteralToDisplayValue should', () => {
    it('strip quotes from SOQL string literal', () => {
      const expected = 'hello';
      const actual = soqlStringLiteralToDisplayValue("'hello'");
      expect(actual).toEqual(expected);
    });
    it('strip SOQL literal string escape characters', () => {
      const expected = '\'"\\';
      const actual = soqlStringLiteralToDisplayValue("'\\'\\\"\\\\'");
      expect(actual).toEqual(expected);
    });
  });
  describe('displayValueToSoqlStringLiteral should', () => {
    it('surround display value with quotes', () => {
      const expected = "'hello'";
      const actual = displayValueToSoqlStringLiteral('hello');
      expect(actual).toEqual(expected);
    });
    it('escape characters that need to be escaped in SOQL string literals', () => {
      const expected = "'\\'\\\"\\\\'";
      const actual = displayValueToSoqlStringLiteral('\'"\\');
      expect(actual).toEqual(expected);
    });
  });
});
