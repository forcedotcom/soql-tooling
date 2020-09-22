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
    fields: ['Name', 'Id']
  };
  const soqlOne = 'Select Name, Id from Account';
  it('transform UI Model to Soql', () => {
    const transformedSoql = convertUiModelToSoql(uiModelOne);
    expect(transformedSoql).toContain(uiModelOne.fields[0]);
    expect(transformedSoql).toContain(uiModelOne.fields[1]);
    expect(transformedSoql).toContain(uiModelOne.sObject);
  });
  it('transforms Soql to UI Model', () => {
    const transformedUiModel = convertSoqlToUiModel(soqlOne);
    expect(transformedUiModel).toEqual(uiModelOne);
  });
});
