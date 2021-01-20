/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
import { Soql } from '@salesforce/soql-model';
import { List, Map } from 'immutable';
import { JsonMap } from '@salesforce/ts-types';

export enum ModelProps {
  SOBJECT = 'sObject',
  FIELDS = 'fields',
  ORDER_BY = 'orderBy',
  LIMIT = 'limit',
  WHERE = 'where',
  WHERE_CONDITIONS = 'conditions',
  WHERE_AND_OR = 'andOr',
  ERRORS = 'errors',
  UNSUPPORTED = 'unsupported',
  ORIGINAL_SOQL_STATEMENT = 'originalSoqlStatement'
}

export enum AndOr {
  AND = 'AND',
  OR = 'OR'
}

// This is to satisfy TS and stay dry
export type IMap = Map<string, string | List<string>>;
// Private immutable interface
export interface ToolingModel extends IMap {
  sObject: string;
  fields: List<string>;
  orderBy: List<Map>;
  limit: string;
  where: List<Map>;
  errors: List<Map>;
  unsupported: List<Map>;
  originalSoqlStatement: string;
}
// Public inteface for accessing modelService.query
export interface ToolingModelJson extends JsonMap {
  sObject: string;
  fields: string[];
  orderBy: JsonMap[];
  limit: string;
  where: { conditions: JsonMap; andOr: string };
  errors: JsonMap[];
  unsupported: JsonMap[];
  originalSoqlStatement: string;
}

export const operatorOptions = [
  {
    value: 'EQ',
    displayValue: '=',
    modelValue: Soql.CompareOperator.EQ
  },
  {
    value: 'NOT_EQ',
    displayValue: '≠',
    modelValue: Soql.CompareOperator.NOT_EQ
  },
  {
    value: 'LT',
    displayValue: '<',
    modelValue: Soql.CompareOperator.LT
  },
  {
    value: 'LT_EQ',
    displayValue: '≤',
    modelValue: Soql.CompareOperator.LT_EQ
  },
  {
    value: 'GT',
    displayValue: '>',
    modelValue: Soql.CompareOperator.GT
  },
  {
    value: 'GT_EQ',
    displayValue: '≥',
    modelValue: Soql.CompareOperator.GT_EQ
  },
  {
    value: 'LIKE',
    displayValue: 'like',
    modelValue: undefined
  },
  {
    value: 'IN',
    displayValue: 'in',
    modelValue: Soql.InOperator.In
  },
  {
    value: 'NOT_IN',
    displayValue: 'not in',
    modelValue: Soql.InOperator.NotIn
  },
  {
    value: 'INCLUDES',
    displayValue: 'includes',
    modelValue: Soql.IncludesOperator.Includes
  },
  {
    value: 'EXCLUDES',
    displayValue: 'excludes',
    modelValue: Soql.IncludesOperator.Excludes
  }
  /*
    use these operators once work to handle
    incomming %, _, concat with plain user text
    is implimented.
    */
  /* {
      value: 'LIKE_START',
      displayValue: 'starts with'
    },
    {
      value: 'LIKE_END',
      displayValue: 'ends with'
    },
    {
      value: 'LIKE_CONTAINS',
      displayValue: 'contains'
    } */
];
