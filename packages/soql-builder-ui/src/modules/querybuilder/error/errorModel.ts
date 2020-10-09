/**
 * ERROR HANDLING UTILITIES
 * THIS CAN BE REPLACED WITH IMPORT FROM SOQL_MODEL ( Fernando work )
 */
export enum ErrorType {
  // eslint-disable-next-line no-unused-vars
  UNKNOWN = 'UNKNOWN',
  // eslint-disable-next-line no-unused-vars
  EMPTY = 'EMPTY',
  // eslint-disable-next-line no-unused-vars
  NOSELECT = 'NOSELECT',
  // eslint-disable-next-line no-unused-vars
  NOSELECTIONS = 'NOSELECTIONS',
  // eslint-disable-next-line no-unused-vars
  NOFROM = 'NOFROM',
  // eslint-disable-next-line no-unused-vars
  INCOMPLETEFROM = 'INCOMPLETEFROM',
  // eslint-disable-next-line no-unused-vars
  INCOMPLETELIMIT = 'INCOMPLETELIMIT'
}

// recoverable field errors
export const recoverableFieldErrors = {};
recoverableFieldErrors[ErrorType.NOSELECT] = true;
recoverableFieldErrors[ErrorType.NOSELECTIONS] = true;
recoverableFieldErrors[ErrorType.EMPTY] = true;

// recoverable from errors
export const recoverableFromErrors = {};
recoverableFromErrors[ErrorType.INCOMPLETEFROM] = true;
recoverableFromErrors[ErrorType.NOFROM] = true;
recoverableFromErrors[ErrorType.EMPTY] = true;

// recoverable limit errors
export const recoverableLimitErrors = {};
recoverableLimitErrors[ErrorType.INCOMPLETELIMIT] = true;

// general recoverable errors
export const recoverableErrors = {
  ...recoverableFieldErrors,
  ...recoverableFromErrors,
  ...recoverableLimitErrors
};
recoverableErrors[ErrorType.EMPTY] = true;

// unrecoverable errors
export const unrecoverableErrors = {};
unrecoverableErrors[ErrorType.UNKNOWN] = true;

// END ERROR HANDLING UTLIITIES
