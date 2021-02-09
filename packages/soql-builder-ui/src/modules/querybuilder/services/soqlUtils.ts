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
import { ToolingModelJson } from './model';

export function convertSoqlToUiModel(soql: string): ToolingModelJson {
  const queryModel = new ModelDeserializer(soql).deserialize();
  const uimodel = convertSoqlModelToUiModel(queryModel);
  return uimodel;
}

export function convertSoqlModelToUiModel(
  queryModel: Soql.Query
): ToolingModelJson {
  const unsupported = [];
  const headerComments = queryModel.headerComments
    ? queryModel.headerComments.text
    : undefined;

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

    if (!SoqlModelUtils.isUnmodeledSyntax(conditionsObj)) {
      const simpleGroupArray = SoqlModelUtils.simpleGroupToArray(conditionsObj);
      where = {
        conditions: simpleGroupArray.conditions.map((condition, index) => {
          return {
            condition,
            index
          };
        }),
        andOr: simpleGroupArray.andOr
      };
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
          SoqlModelUtils.getUnmodeledSyntax(prop, unsupported);
        }
      }
    }
  }

  const toolingModelTemplate: ToolingModelJson = {
    headerComments: headerComments,
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
    const simpleGroupArray = uiModel.where.conditions.map((condition) => {
      const uiModelCondition = condition.condition;
      let returnCondition = undefined;

      const field =
        uiModelCondition.field && uiModelCondition.field.fieldName
          ? new Impl.FieldRefImpl(uiModelCondition.field.fieldName)
          : undefined;

      enum ConditionType {
        FieldCompare = 0,
        In = 1,
        Includes = 2
      }
      let conditionType = ConditionType.FieldCompare;
      switch (uiModelCondition.operator) {
        case Soql.ConditionOperator.In:
        case Soql.ConditionOperator.NotIn: {
          conditionType = ConditionType.In;
          break;
        }
        case Soql.ConditionOperator.Includes:
        case Soql.ConditionOperator.Excludes: {
          conditionType = ConditionType.Includes;
          break;
        }
      }

      const compareValue = uiModelCondition.compareValue
        ? new Impl.LiteralImpl(
          uiModelCondition.compareValue.type,
          uiModelCondition.compareValue.value
        )
        : uiModelCondition.values
          ? uiModelCondition.values.map(
            (value) => new Impl.LiteralImpl(value.type, value.value)
          )
          : undefined;

      if (field && compareValue) {
        switch (conditionType) {
          case ConditionType.FieldCompare: {
            returnCondition = new Impl.FieldCompareConditionImpl(
              field,
              uiModelCondition.operator,
              compareValue
            );
            break;
          }
          case ConditionType.In: {
            returnCondition = new Impl.InListConditionImpl(
              field,
              uiModelCondition.operator,
              compareValue
            );
            break;
          }
          case ConditionType.Includes: {
            returnCondition = new Impl.IncludesConditionImpl(
              field,
              uiModelCondition.operator,
              compareValue
            );
            break;
          }
        }
      }

      return returnCondition;
    });
    whereExprsImpl = SoqlModelUtils.arrayToSimpleGroup(
      simpleGroupArray,
      uiModel.where.andOr
    );
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
  if (uiModel.headerComments) {
    queryModel.headerComments = new Impl.HeaderCommentsImpl(
      uiModel.headerComments
    );
  }
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
  displayValue = displayValue.replace(/\\'/g, "'");
  displayValue = displayValue.replace(/\\\\/g, '\\');

  return displayValue;
}

export function displayValueToSoqlStringLiteral(displayString: string): string {
  // string
  let normalized = displayString;

  // escape
  normalized = normalized.replace(/\\/g, '\\\\');
  normalized = normalized.replace(/'/g, "\\'");
  normalized = normalized.replace(/"/g, '\\"');

  // quote
  normalized = `'${normalized}'`;

  return normalized;
}
