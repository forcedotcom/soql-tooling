/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SObjectTypeUtils, SObjectType } from './sobjectUtils';


describe('SObjectTypeUtils should', () => {
  const sobjectMetadata = {
    fields: [
      { name: 'Id', type: 'id' },
      { name: 'Name', type: 'string' },
      { name: 'AccountSource', type: 'picklist' },
      { name: 'AnnualRevenue', type: 'currency' },
      { name: 'BillingAddress', type: 'address' },
      { name: 'IsBuyer', type: 'boolean' },
      { name: 'CleanStatus', type: 'picklist' },
      { name: 'CreatedById', type: 'reference' },
      { name: 'DandbCompanyId', type: 'reference' },
      { name: 'Jigsaw', type: 'string' },
      { name: 'Industry', type: 'picklist' },
      { name: 'Phone', type: 'phone' }
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

  it('should return AnyType by default like when a field cannot be found', () => {
    const expected = SObjectType.AnyType;
    const actual = new SObjectTypeUtils(sobjectMetadata).getType('foo');

    expect(actual).toEqual(expected);
  });
});
