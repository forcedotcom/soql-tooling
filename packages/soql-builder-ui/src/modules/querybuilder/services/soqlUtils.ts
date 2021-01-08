/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Impl,
  Soql,
  SoqlModelUtils,
  ModelSerializer,
  ModelDeserializer
} from '@salesforce/soql-model';
import { ToolingModelJson } from './toolingModelService';

const staticDateRangeLiterals = [
  'yesterday',
  'today',
  'tomorrow',
  'last_week',
  'this_week',
  'next_week',
  'last_month',
  'thid_month',
  'next_month',
  'last_90_days',
  'next_90_days',
  'last_quarter',
  'this_quarter',
  'next_quarter',
  'last_year',
  'this_year',
  'next_year',
  'last_fiscal_quarter',
  'this_fiscal_quarter',
  'next_fiscal_quarter',
  'last_fiscal_year',
  'this_fiscal_year',
  'next_fiscal_year'
];

const parameterizedDateRangeLiteralPrefixes = [
  'last_n_days:',
  'next_n_days:',
  'last_n_weeks:',
  'next_n_weeks:',
  'last_n_months:',
  'next_n_months:',
  'last_n_quarters:',
  'next_n_quarters:',
  'last_n_years:',
  'next_n_years:',
  'last_n_fiscal_quarters:',
  'next_n_fiscal_quarters:',
  'last_n_fiscal_years:',
  'next_n_fiscal_years:'
];

export function isCurrencyLiteral(s: string): boolean {
  return /^[a-zA-Z]{3}[+-]?[0-9]*[.]?[0-9]+$/.test(s.trim());
}

export function isDateLiteral(s: string): boolean {
  return isDatePattern(s) || isDateRangeLiteral(s);
}

function isDatePattern(s: string): boolean {
  const DATE_ONLY_PATTERN = /^[1-4][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]$/;
  const DATE_TIME_UTC_PATTERN = /^[1-4][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9][tT][0-2][0-9]:[0-5][0-9]:[0-5][0-9][zZ]$/;
  const DATE_TIME_OFFSET_PATTERN = /^[1-4][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9][tT][0-2][0-9]:[0-5][0-9]:[0-5][0-9][+-][0-1][0-9]:[0-5][0-9]$/;
  return DATE_ONLY_PATTERN.test(s.trim())
    || DATE_TIME_UTC_PATTERN.test(s.trim())
    || DATE_TIME_OFFSET_PATTERN.test(s.trim());
}

function isDateRangeLiteral(s: string): boolean {
  return isStaticDateRangeLiteral(s) || isParameterizedDateRangeLiteral(s);
}

function isStaticDateRangeLiteral(s: string): boolean {
  return staticDateRangeLiterals.includes(s.trim().toLowerCase());
}

function isParameterizedDateRangeLiteral(s: string): boolean {
  let isMatch = false;
  const trimmed = s.trim();
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx >= 0) {
    const prefix = trimmed.substring(0, colonIdx + 1);
    if (parameterizedDateRangeLiteralPrefixes.includes(prefix.toLowerCase())) {
      const theRest = trimmed.substring(colonIdx + 1);
      isMatch = /^[0-9]+$/.test(theRest);
    }
  }
  return isMatch;
}


export function convertSoqlToUiModel(soql: string): ToolingModelJson {
  const queryModel = new ModelDeserializer(soql).deserialize();
  const uimodel = convertSoqlModelToUiModel(queryModel);
  return uimodel;
}

export function convertSoqlModelToUiModel(
  queryModel: Soql.Query
): ToolingModelJson {
  const unsupported = [];
  const fields =
    queryModel.select &&
      (queryModel.select as Soql.SelectExprs).selectExpressions
      ? (queryModel.select as Soql.SelectExprs).selectExpressions
        .filter((expr) => !SoqlModelUtils.containsUnmodeledSyntax(expr))
        .map((expr) => {
          if (expr.field.fieldName) {
            return expr.field.fieldName;
          }
          return undefined;
        })
      : undefined;

  const sObject = queryModel.from && queryModel.from.sobjectName;

  let where;
  if (queryModel.where && queryModel.where.condition) {
    const conditionsObj = queryModel.where.condition;

    if (SoqlModelUtils.isSimpleGroup(conditionsObj)) {
      where = SoqlModelUtils.simpleGroupToArray(conditionsObj);
      where.conditions = where.conditions
        .filter(
          (condition) => !SoqlModelUtils.containsUnmodeledSyntax(condition)
        )
        .map((expression, index) => {
          const operator =
            expression instanceof Impl.LikeConditionImpl
              ? 'LIKE'
              : SoqlModelUtils.getKeyByValue(
                Soql.CompareOperator,
                expression.operator
              );

          return {
            field: expression.field.fieldName,
            operator: operator,
            criteria: expression.compareValue,
            index
          };
        });

      where.andOr = queryModel.where.condition.andOr;
    } else {
      unsupported.push('where:complex-group');
    }
  }

  const orderBy = queryModel.orderBy
    ? queryModel.orderBy.orderByExpressions
      // TODO: Deal with empty OrderBy.  returns unmodelled syntax.
      .filter((expr) => !SoqlModelUtils.containsUnmodeledSyntax(expr))
      .map((expression) => {
        return {
          field: expression.field.fieldName,
          order: expression.order,
          nulls: expression.nullsOrder
        };
      })
    : [];

  const limit = queryModel.limit
    ? queryModel.limit.limit.toString()
    : undefined;

  const errors = queryModel.errors;
  for (const key in queryModel) {
    // eslint-disable-next-line no-prototype-builtins
    if (queryModel.hasOwnProperty(key)) {
      // @ts-ignore
      const prop = queryModel[key];
      if (typeof prop === 'object') {
        if (SoqlModelUtils.containsUnmodeledSyntax(prop)) {
          unsupported.push(prop.unmodeledSyntax);
        }
      }
    }
  }

  const toolingModelTemplate: ToolingModelJson = {
    sObject: sObject || '',
    fields: fields || [],
    where: where || { conditions: [], andOr: undefined },
    orderBy: orderBy || [],
    limit: limit || '',
    errors: errors || [],
    unsupported: unsupported || []
  };

  // USEFUL console.log('Soql -> Ui ', JSON.stringify(toolingModelTemplate.orderBy));

  return toolingModelTemplate;
}

export function convertUiModelToSoql(uiModel: ToolingModelJson): string {
  const soqlModel = convertUiModelToSoqlModel(uiModel);
  const soql = convertSoqlModelToSoql(soqlModel);
  return soql;
}

function convertUiModelToSoqlModel(uiModel: ToolingModelJson): Soql.Query {
  const selectExprs = uiModel.fields.map(
    (field) => new Impl.FieldSelectionImpl(new Impl.FieldRefImpl(field))
  );

  let whereExprsImpl;
  if (uiModel.where && uiModel.where.conditions.length) {
    const whereExprsArray = uiModel.where.conditions.map((where) => {
      const criteriaImpl =
        where.criteria instanceof Impl.LiteralImpl
          ? where.criteria
          : new Impl.LiteralImpl(
            where.criteria.type,
            `${where.criteria.value}`
          );
      // this logic is temporary until we handle starts, ends with, contains
      if (where.operator === 'LIKE') {
        return new Impl.LikeConditionImpl(
          new Impl.FieldRefImpl(where.field),
          criteriaImpl
        );
      }

      return new Impl.FieldCompareConditionImpl(
        new Impl.FieldRefImpl(where.field),
        Soql.CompareOperator[where.operator],
        criteriaImpl
      );
    });

    const andOr = uiModel.where.andOr;
    whereExprsImpl = SoqlModelUtils.arrayToSimpleGroup(whereExprsArray, andOr);
  }

  const where =
    whereExprsImpl && Object.keys(whereExprsImpl).length
      ? new Impl.WhereImpl(whereExprsImpl)
      : undefined;

  const orderByExprs = uiModel.orderBy.map(
    (orderBy) =>
      new Impl.OrderByExpressionImpl(
        new Impl.FieldRefImpl(orderBy.field),
        orderBy.order,
        orderBy.nulls
      )
  );
  const orderBy =
    orderByExprs.length > 0 ? new Impl.OrderByImpl(orderByExprs) : undefined;
  const limit =
    uiModel.limit.length > 0 ? new Impl.LimitImpl(uiModel.limit) : undefined;
  const queryModel = new Impl.QueryImpl(
    new Impl.SelectExprsImpl(selectExprs),
    new Impl.FromImpl(uiModel.sObject),
    where,
    undefined,
    undefined,
    orderBy,
    limit
  );
  return queryModel;
}

function convertSoqlModelToSoql(soqlModel: Soql.Query): string {
  const serializer = new ModelSerializer(soqlModel);
  const query = serializer.serialize();
  return query;
}

export function soqlStringLiteralToDisplayValue(soqlString: string): string {
  let displayValue = soqlString;

  // unquote
  if (displayValue.startsWith("'")) {
    displayValue = displayValue.substring(1);
  }
  if (displayValue.endsWith("'")) {
    displayValue = displayValue.substring(0, displayValue.length - 1);
  }

  // unescape
  displayValue = displayValue.replace(/\\"/g, '"');
  displayValue = displayValue.replace(/\\'/g, '\'');
  displayValue = displayValue.replace(/\\\\/g, '\\');

  return displayValue;
}

export function displayValueToSoqlStringLiteral(displayString: string): string {
  // string
  let normalized = displayString;

  // escape
  normalized = normalized.replace(/\\/g, '\\\\');
  normalized = normalized.replace(/'/g, '\\\'');
  normalized = normalized.replace(/"/g, '\\"');

  // quote
  normalized = `'${normalized}'`;

  return normalized;
}
