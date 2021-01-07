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
  grammarRule?: string;
}

export enum ErrorType {
  UNKNOWN = 'UNKNOWN',
  EMPTY = 'EMPTY',
  NOSELECT = 'NOSELECT',
  NOSELECTIONS = 'NOSELECTIONS',
  NOFROM = 'NOFROM',
  INCOMPLETEFROM = 'INCOMPLETEFROM',
  INCOMPLETELIMIT = 'INCOMPLETELIMIT'
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
  alias?: UnmodeledSyntax;
}

export interface FieldSelection extends SelectExpression {
  field: Field;
}

export interface Field extends SoqlModelObject {
  // field name => FieldRef
  // function reference => UnmodeledSyntax
  // distance => UnmodeledSyntax
}

export interface FieldRef extends Field {
  fieldName: string;
}

export interface Limit extends SoqlModelObject {
  limit: number;
}

export interface OrderBy extends SoqlModelObject {
  orderByExpressions: OrderByExpression[];
}

export interface OrderByExpression extends SoqlModelObject {
  field: Field;
  order?: Order;
  nullsOrder?: NullsOrder;
}

export enum Order {
  Ascending = 'ASC',
  Descending = 'DESC'
}

export enum NullsOrder {
  First = 'NULLS FIRST',
  Last = 'NULLS LAST'
}

export enum AndOr {
  And = 'AND',
  Or = 'OR'
}

export enum CompareOperator {
  EQ = '=',
  NOT_EQ = '!=',
  ALT_NOT_EQ = '<>',
  LT_EQ = '<=',
  GT_EQ = '>=',
  LT = '<',
  GT = '>'
}

export enum IncludesOperator {
  Includes = 'INCLUDES',
  Excludes = 'EXCLUDES'
}

export enum InOperator {
  In = 'IN',
  NotIn = 'NOT IN'
}


export interface CompareValue extends SoqlModelObject {
  // literal => Literal
  // colon expression => UnmodeledSyntax
}

export enum LiteralType {
  Boolean = 'BOOLEAN',
  Currency = 'CURRENCY',
  Date = 'DATE',
  Null = 'NULL',
  Number = 'NUMBER',
  String = 'STRING'
}

export interface Literal extends CompareValue {
  type: LiteralType;
  value: string;
}

export interface Condition extends SoqlModelObject {
  // ( nested-condition ) => NestedCondition
  // NOT condition => NotCondition
  // condition-1 AndOr condition-2 => AndOrCondition
  // field CompareOperator value => FieldCompareCondition
  // calculation CompareOperator value => UnmodeledSyntax
  // distance CompareOperator value => UnmodeledSyntax
  // field LIKE value => LikeCondition
  // field IncludesOperator ( values ) => IncludesCondition
  // field InOperator ( semi-join ) => UnmodeledSyntax
  // field InOperator ( values ) => InListCondition
}

export interface NestedCondition extends Condition {
  condition: Condition;
}

export interface NotCondition extends Condition {
  condition: Condition;
}

export interface AndOrCondition extends Condition {
  leftCondition: Condition;
  andOr: AndOr;
  rightCondition: Condition;
}

export interface FieldCompareCondition extends Condition {
  field: Field;
  operator: CompareOperator;
  compareValue: CompareValue;
}

export interface LikeCondition extends Condition {
  field: Field;
  compareValue: CompareValue;
}

// Not in use yet
export interface IncludesCondition extends Condition {
  field: Field;
  operator: IncludesOperator;
  values: CompareValue[];
}

// Not in use yet
export interface InListCondition extends Condition {
  field: Field;
  operator: InOperator;
  values: CompareValue[];
}

export interface Where extends SoqlModelObject {
  condition?: Condition;
}

export interface With extends SoqlModelObject { }
export interface GroupBy extends SoqlModelObject { }
export interface Offset extends SoqlModelObject { }
export interface Bind extends SoqlModelObject { }
export interface RecordTrackingType extends SoqlModelObject { }
export interface Update extends SoqlModelObject { }

export interface UnmodeledSyntax
  extends Select,
  SelectExpression,
  Field,
  Where,
  Condition,
  CompareValue,
  With,
  GroupBy,
  Offset,
  Bind,
  RecordTrackingType,
  Update {
  unmodeledSyntax: string;
  reason: string;
}
