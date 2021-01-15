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
    orderBy: [{ field: 'Name', order: 'ASC', nulls: 'NULLS FIRST' }],
    limit: '11',
    errors: [],
    unsupported: []
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
    unsupported: [
      {
        unmodeledSyntax: 'GROUP BY',
        reason: 'unmodeled:group-by'
      }
    ]
  };
  const soqlOne =
    'Select Name, Id from Account ORDER BY Name ASC NULLS FIRST LIMIT 11';
  const soqlError = 'Select Name from Account GROUP BY';
  it('transform UI Model to Soql', () => {
    const transformedSoql = convertUiModelToSoql(uiModelOne);
    expect(transformedSoql).toContain(uiModelOne.fields[0]);
    expect(transformedSoql).toContain(uiModelOne.fields[1]);
    expect(transformedSoql).toContain(uiModelOne.sObject);
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
    expect(transformedUiModel).toEqual(uiModelOne);
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
});
