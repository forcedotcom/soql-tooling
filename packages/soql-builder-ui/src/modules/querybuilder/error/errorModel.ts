/**
 * ERROR HANDLING UTILITIES
 * THIS CAN BE REPLACED WITH IMPORT FROM SOQL_MODEL ( Fernando work )
 */

import { Soql } from '@salesforce/soql-model';

// export enum ErrorType {
//   // eslint-disable-next-line no-unused-vars
//   UNKNOWN = 'UNKNOWN',
//   // eslint-disable-next-line no-unused-vars
//   EMPTY = 'EMPTY',
//   // eslint-disable-next-line no-unused-vars
//   NOSELECT = 'NOSELECT',
//   // eslint-disable-next-line no-unused-vars
//   NOSELECTIONS = 'NOSELECTIONS',
//   // eslint-disable-next-line no-unused-vars
//   NOFROM = 'NOFROM',
//   // eslint-disable-next-line no-unused-vars
//   INCOMPLETEFROM = 'INCOMPLETEFROM',
//   // eslint-disable-next-line no-unused-vars
//   INCOMPLETELIMIT = 'INCOMPLETELIMIT'
// }

// recoverable field errors
export const recoverableFieldErrors = {};
recoverableFieldErrors[Soql.ErrorType.NOSELECT] = true;
recoverableFieldErrors[Soql.ErrorType.NOSELECTIONS] = true;
recoverableFieldErrors[Soql.ErrorType.EMPTY] = true;

// recoverable from errors
export const recoverableFromErrors = {};
recoverableFromErrors[Soql.ErrorType.INCOMPLETEFROM] = true;
recoverableFromErrors[Soql.ErrorType.NOFROM] = true;
recoverableFromErrors[Soql.ErrorType.EMPTY] = true;

// recoverable limit errors
export const recoverableLimitErrors = {};
recoverableLimitErrors[Soql.ErrorType.INCOMPLETELIMIT] = true;

/**
 * EMPTYWHERE = 'EMPTYWHERE',
  INCOMPLETENESTEDCONDITION = 'INCOMPLETENESTEDCONDITION',
  INCOMPLETEANDORCONDITION = 'INCOMPLETEANDORCONDITION',
  INCOMPLETENOTCONDITION = 'INCOMPLETENOTCONDITION',
  UNRECOGNIZEDCOMPAREVALUE = 'UNRECOGNIZEDCOMPAREVALUE',
  UNRECOGNIZEDCOMPAREOPERATOR = 'UNRECOGNIZEDCOMPAREOPERATOR',
  UNRECOGNIZEDCOMPAREFIELD = 'UNRECOGNIZEDCOMPAREFIELD',
  NOCOMPAREVALUE = 'NOCOMPAREVALUE',
  NOCOMPAREOPERATOR = 'NOCOMPAREOPERATOR'
 */
// recoverable where errors
export const recoverableWhereErrors = {};
recoverableWhereErrors[Soql.ErrorType.EMPTYWHERE] = true;
recoverableWhereErrors[Soql.ErrorType.INCOMPLETENESTEDCONDITION] = true;
recoverableWhereErrors[Soql.ErrorType.INCOMPLETEANDORCONDITION] = true;
recoverableWhereErrors[Soql.ErrorType.INCOMPLETENOTCONDITION] = true;
recoverableWhereErrors[Soql.ErrorType.UNRECOGNIZEDCOMPAREVALUE] = true;
recoverableWhereErrors[Soql.ErrorType.UNRECOGNIZEDCOMPAREOPERATOR] = true;
recoverableWhereErrors[Soql.ErrorType.UNRECOGNIZEDCOMPAREFIELD] = true;
recoverableWhereErrors[Soql.ErrorType.NOCOMPAREVALUE] = true;
recoverableWhereErrors[Soql.ErrorType.NOCOMPAREOPERATOR] = true;

// general recoverable errors
export const recoverableErrors = {
  ...recoverableFieldErrors,
  ...recoverableFromErrors,
  ...recoverableLimitErrors
};
recoverableErrors[Soql.ErrorType.EMPTY] = true;

// unrecoverable errors
export const unrecoverableErrors = {};
unrecoverableErrors[Soql.ErrorType.UNKNOWN] = true;

// END ERROR HANDLING UTLIITIES
