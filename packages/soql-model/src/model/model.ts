/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Parser from '@salesforce/soql-parser';


export interface ModelError {
  type: ErrorType;
  message: string;
  lineNumber: number;
  charInLine: number;
}

export enum ErrorType {
  UNKNOWN = 'UNKNOWN',
  EMPTY = 'EMPTY',
  NOSELECT = 'NOSELECT',
  NOSELECTIONS = 'NOSELECTIONS',
  NOFROM = 'NOFROM',
  INCOMPLETEFROM = 'INCOMPLETEFROM'
}

export interface SoqlModelObject {
  toSoqlSyntax(options?: SyntaxOptions): string;
  errors?: ModelError[];
}

export class SyntaxOptions {
  wrapColumn: number = 80;
  indent: number = 2;
}

export interface Query extends SoqlModelObject {
  select?: Select;
  from?: From;
  where?: Where;
  with?: With;
  groupBy?: GroupBy;
  orderBy?: OrderBy;
  limit?: Limit;
  offset?: Offset;
  bind?: Bind;
  recordTrackingType?: RecordTrackingType;
  update?: Update;
}

export interface From extends SoqlModelObject {
  sobjectName: string;
  as?: UnmodeledSyntax;
  using?: UnmodeledSyntax;
}

export interface Select extends SoqlModelObject {
  // SELECT COUNT() => UnmodeledSyntax
  // SELECT [field] [subquery] [typeof] [distance] => SelectExprs
}

export interface SelectExprs extends Select {
  selectExpressions: SelectExpression[];
}

export interface SelectExpression extends SoqlModelObject {
  // field => Field
  // subquery => UnmodeledSyntax
  // typeof => UnmodeledSyntax
  // distance => UnmodeledSyntax
  alias?: UnmodeledSyntax;
}

export interface Field extends SelectExpression {
  // field name => FieldRef
  // function reference => UnmodeledSyntax
}

export interface FieldRef extends Field {
  fieldName: string;
}

export interface Where extends SoqlModelObject { }
export interface With extends SoqlModelObject { }
export interface GroupBy extends SoqlModelObject { }
export interface OrderBy extends SoqlModelObject { }
export interface Limit extends SoqlModelObject { }
export interface Offset extends SoqlModelObject { }
export interface Bind extends SoqlModelObject { }
export interface RecordTrackingType extends SoqlModelObject { }
export interface Update extends SoqlModelObject { }

export interface UnmodeledSyntax
  extends Select,
  SelectExpression,
  Field,
  Where,
  With,
  GroupBy,
  OrderBy,
  Limit,
  Offset,
  Bind,
  RecordTrackingType,
  Update {
  unmodeledSyntax: string;
}
