/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { convertUiModelToSoql, convertSoqlToUiModel } from './soqlUtils';
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
});
