/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { convertUiModelToSoql, convertSoqlToUiModel, soqlStringLiteralToDisplayValue, displayValueToSoqlStringLiteral, isDateLiteral } from './soqlUtils';
import { ToolingModelJson } from './toolingModelService';

describe('SoqlUtils', () => {
  const uiModelOne: ToolingModelJson = {
    sObject: 'Account',
    fields: ['Name', 'Id'],
    where: {
      conditions: [
        {
          field: 'Name',
          operator: 'EQ',
          criteria: { type: 'STRING', value: "'pwt'" },
          index: 0
        },
        {
          field: 'Id',
          operator: 'EQ',
          criteria: { type: 'NUMBER', value: '123456' },
          index: 1
        }
      ],
      andOr: 'AND'
    },
    orderBy: [{ field: 'Name', order: 'ASC', nulls: 'NULLS FIRST' }],
    limit: '11',
    errors: [],
    unsupported: []
  };
  const soqlOne =
    "Select Name, Id from Account WHERE Name = 'pwt' AND Id = 123456 ORDER BY Name ASC NULLS FIRST LIMIT 11";
  const unsupportedWhereExpr =
    "Select Name, Id from Account WHERE (Name = 'pwt' AND Id = 123456) OR Id = 654321 ORDER BY Name ASC NULLS FIRST LIMIT 11";
  it('transform UI Model to Soql', () => {
    const transformedSoql = convertUiModelToSoql(uiModelOne);
    expect(transformedSoql).toContain(uiModelOne.fields[0]);
    expect(transformedSoql).toContain(uiModelOne.fields[1]);
    expect(transformedSoql).toContain(uiModelOne.sObject);
    expect(transformedSoql).toContain(
      uiModelOne.where.conditions[0].criteria.value
    );
    expect(transformedSoql).toContain(
      uiModelOne.where.conditions[1].criteria.value
    );
    expect(transformedSoql).toContain(uiModelOne.where.andOr);
    expect(transformedSoql).toContain('=');
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].field);
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].order);
    expect(transformedSoql).toContain(uiModelOne.orderBy[0].nulls);
    expect(transformedSoql).toContain('11');
  });

  it('transforms Soql to UI Model', () => {
    const transformedUiModel = convertSoqlToUiModel(soqlOne);
    expect(transformedUiModel).toEqual(uiModelOne);
  });

  it('catches unsupported syntyax in where', () => {
    const transformedUiModel = convertSoqlToUiModel(unsupportedWhereExpr);
    expect(transformedUiModel.where.conditions.length).toBe(0);
    expect(transformedUiModel.unsupported.length).toBe(1);
    expect(transformedUiModel.unsupported[0]).toContain('where:');
  });
  describe('soqlStringLiteralToDisplayValue should', () => {
    it('strip quotes from SOQL string literal', () => {
      const expected = "hello";
      const actual = soqlStringLiteralToDisplayValue("'hello'");
      expect(actual).toEqual(expected);
    });
    it('strip SOQL literal string escape characters', () => {
      const expected = "'\"\\";
      const actual = soqlStringLiteralToDisplayValue("'\\'\\\"\\\\'");
      expect(actual).toEqual(expected);
    });
  });
  describe('displayValueToSoqlStringLiteral should', () => {
    it('surround display value with quotes', () => {
      const expected = "'hello'";
      const actual = displayValueToSoqlStringLiteral("hello");
      expect(actual).toEqual(expected);
    });
    it('escape characters that need to be escaped in SOQL string literals', () => {
      const expected = "'\\'\\\"\\\\'";
      const actual = displayValueToSoqlStringLiteral("'\"\\");
      expect(actual).toEqual(expected);
    });
  });
  describe('isDateLiteral should', () => {
    it('return true for date only patterns', () => {
      expect(isDateLiteral('2020-01-01')).toBeTruthy();
    });
    it('return true for date and time UTC patterns', () => {
      expect(isDateLiteral('2020-01-01T12:00:00Z')).toBeTruthy();
    });
    it('return true for date and time +- offset patterns', () => {
      expect(isDateLiteral('2020-01-01T12:00:00+05:00')).toBeTruthy();
    });
    it('return false for incorrect or incomplete date literal patterns', () => {
      expect(isDateLiteral('2020-01-01T12:00')).toBeFalsy();
      expect(isDateLiteral('2020-01-01T12:00:00-5:00')).toBeFalsy();
      expect(isDateLiteral('202020-01-01T12:00:00-05:00')).toBeFalsy();
    });
    it('return true for date range literals', () => {
      expect(isDateLiteral('tomorrow')).toBeTruthy();
      expect(isDateLiteral('last_week')).toBeTruthy();
    });
    it('return false for incorrect date range literals', () => {
      expect(isDateLiteral('lastweek')).toBeFalsy();
    });
    it('return true for parameterized date range literals', () => {
      expect(isDateLiteral('next_n_quarters:5')).toBeTruthy();
      expect(isDateLiteral('last_n_weeks:35')).toBeTruthy();
    });
    it('return false for incorrect parameterized date range literals', () => {
      expect(isDateLiteral('last_n_weeks: 35')).toBeFalsy();
      expect(isDateLiteral('last_n_weeks:')).toBeFalsy();
      expect(isDateLiteral('last_n_weeks')).toBeFalsy();
    });
  });
});
