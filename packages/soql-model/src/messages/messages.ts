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
}
