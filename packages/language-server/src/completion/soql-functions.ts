/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

/**
 * Metadata about SOQL built-in functions and operators
 *
 * Aggregate functions reference:
 * https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select_agg_functions_field_types.htm
 *
 * NOTE: The g4 grammar declares `COUNT()` explicitly, but not `COUNT(xyz)`.
 *
 */

interface SOQLFunction {
  name: string;
  types: string[];
  isAggregate: boolean;
}

export const soqlFunctions: SOQLFunction[] = [
  {
    name: 'AVG',
    types: ['double', 'int', 'currency', 'percent'],
    isAggregate: true,
  },
  {
    name: 'COUNT',
    types: [
      'date',
      'datetime',
      'double',
      'int',
      'string',
      'combobox',
      'currency',
      'DataCategoryGroupReference', // ?!
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
    isAggregate: true,
  },
  {
    name: 'COUNT_DISTINCT',
    types: [
      'date',
      'datetime',
      'double',
      'int',
      'string',
      'combobox',
      'currency',
      'DataCategoryGroupReference', // ?!
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
    isAggregate: true,
  },
  {
    name: 'MAX',
    types: [
      'date',
      'datetime',
      'double',
      'int',
      'string',
      'time',
      'combobox',
      'currency',
      'DataCategoryGroupReference', // ?!
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
    isAggregate: true,
  },
  {
    name: 'MIN',
    types: [
      'date',
      'datetime',
      'double',
      'int',
      'string',
      'time',
      'combobox',
      'currency',
      'DataCategoryGroupReference', // ?!
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
    isAggregate: true,
  },
  {
    name: 'SUM',
    types: ['int', 'double', 'currency', 'percent'],
    isAggregate: true,
  },
];

export const soqlFunctionsByName = soqlFunctions.reduce((result, soqlFn) => {
  result[soqlFn.name] = soqlFn;
  return result;
}, {} as Record<string, SOQLFunction>);

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

// SOQL operators semantics.
// Operators not listed here (i.e. equality operators) are allowed on all types
// and allow nulls
export const soqlOperators: {
  [key: string]: { types: string[]; notNullable: boolean };
} = {
  '<': { types: typesForLT_GT_operators, notNullable: true },
  '<=': { types: typesForLT_GT_operators, notNullable: true },
  '>': { types: typesForLT_GT_operators, notNullable: true },
  '>=': { types: typesForLT_GT_operators, notNullable: true },
  INCLUDES: { types: ['multipicklist'], notNullable: true },
  EXCLUDES: { types: ['multipicklist'], notNullable: true },
  LIKE: { types: ['string', 'textarea', 'time'], notNullable: true },
};
