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
