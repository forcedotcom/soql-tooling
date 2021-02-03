/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export namespace Messages {
  export const error_empty = 'Incomplete SOQL statement. The SELECT and FROM clauses are required.'
  export const error_noSelect = 'A SELECT clause is required.';
  export const error_noSelections = 'Incomplete SELECT clause. The SELECT clause must contain at least one SELECT expression.';
  export const error_noFrom = 'A FROM clause is required.';
  export const error_incompleteFrom = 'Incomplete FROM clause. The FROM clause requires an object.';
  export const error_incompleteLimit = 'Incomplete LIMIT clause. The LIMIT keyword must be followed by a number.';
  export const error_emptyWhere = 'Incomplete WHERE clause. The WHERE clause must contain a condition.';
  export const error_incompleteNestedCondition = 'Incomplete condition. A closing parenthesis is required.';
  export const error_incompleteAndOrCondition = 'Incomplete condition. Conditions before and after the AND or OR keyword are required.';
  export const error_incompleteNotCondition = 'Incomplete condition. NOT must be followed by a condition.';
  export const error_unrecognizedCompareValue = 'Unrecognized comparison value.';
  export const error_unrecognizedCompareOperator = 'Unrecognized comparison operator.';
  export const error_unrecognizedCompareField = 'Unrecognized comparison field.';
  export const error_noCompareValue = 'Incomplete condition. Comparison value is required.';
  export const error_noCompareOperator = 'Incomplete condition. Comparison operator and value is required.';
  export const error_fieldInput_boolean = 'Value must be TRUE or FALSE';
  export const error_fieldInput_currency = 'Currency value is not valid';
  export const error_fieldInput_date = 'Date value is not valid';
  export const error_fieldInput_float = 'Value must be numeric';
  export const error_fieldInput_integer = 'Value must be a whole number';
  export const error_fieldInput_picklist = 'Value must be one of: {0}';
  export const error_operatorInput = "{0} operator can't be used for this field type";
}
