/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SObjectTypeUtils, SObjectType } from './sobjectUtils';


describe('SObjectTypeUtils should', () => {
  const sobjectMetadata = {
    fields: [
      { name: 'Id', type: 'id', picklistValues: [] },
      { name: 'Name', type: 'string', picklistValues: [] },
      { name: 'AccountSource', type: 'picklist', picklistValues: [{ value: 'apple' }, { value: 'banana' }, { value: 'cherry' }] },
      { name: 'AnnualRevenue', type: 'currency', picklistValues: [] },
      { name: 'BillingAddress', type: 'address', picklistValues: [] },
      { name: 'IsBuyer', type: 'boolean', picklistValues: [] },
      { name: 'CleanStatus', type: 'picklist', picklistValues: [{ value: 'apple' }, { value: 'banana' }, { value: 'cherry' }] },
      { name: 'CreatedById', type: 'reference', picklistValues: [] },
      { name: 'DandbCompanyId', type: 'reference', picklistValues: [] },
      { name: 'Jigsaw', type: 'string', picklistValues: [] },
      { name: 'Industry', type: 'picklist', picklistValues: [{ value: 'apple' }, { value: 'banana' }, { value: 'cherry' }] },
      { name: 'Phone', type: 'phone', picklistValues: [] }
    ]
  };

  it('return the type of a field found in an SObject', () => {
    const expected = [
      SObjectType.Id,
      SObjectType.String,
      SObjectType.Picklist,
      SObjectType.Currency,
      SObjectType.Address,
      SObjectType.Boolean,
      SObjectType.Picklist,
      SObjectType.Reference,
      SObjectType.Reference,
      SObjectType.String,
      SObjectType.Picklist,
      SObjectType.Phone
    ];
    const sobjectTypeUtils = new SObjectTypeUtils(sobjectMetadata);
    const actual = sobjectMetadata.fields.map(field => sobjectTypeUtils.getType(field.name));

    expect(actual).toEqual(expected);
  });

  it('return AnyType by default like when a field cannot be found', () => {
    const expected = SObjectType.AnyType;
    const actual = new SObjectTypeUtils(sobjectMetadata).getType('foo');

    expect(actual).toEqual(expected);
  });

  it('return a string list of picklist values', () => {
    const expected = [
      [],
      [],
      ['apple', 'banana', 'cherry'],
      [],
      [],
      [],
      ['apple', 'banana', 'cherry'],
      [],
      [],
      [],
      ['apple', 'banana', 'cherry'],
      [],
    ];
    const sobjectTypeUtils = new SObjectTypeUtils(sobjectMetadata);
    const actual = sobjectMetadata.fields.map(field => sobjectTypeUtils.getPicklistValues(field.name));

    expect(actual).toEqual(expected);
  });
});
