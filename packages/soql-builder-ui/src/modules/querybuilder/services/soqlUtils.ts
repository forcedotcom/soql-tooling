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

  const errors = queryModel.errors;
  const unsupported = [];
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
    orderBy: orderBy || [],
    errors: errors || [],
    unsupported: unsupported || []
  };

  console.log('Soql -> Ui ', JSON.stringify(toolingModelTemplate.orderBy));

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
  const orderByExprs = uiModel.orderBy.map(
    (orderBy) =>
      new Impl.OrderByExpressionImpl(
        new Impl.FieldRefImpl(orderBy.field),
        orderBy.order,
        orderBy.nulls
      )
  );
  const queryModel = new Impl.QueryImpl(
    new Impl.SelectExprsImpl(selectExprs),
    new Impl.FromImpl(uiModel.sObject),
    undefined,
    undefined,
    undefined,
    new Impl.OrderByImpl(orderByExprs)
  );
  return queryModel;
}

function convertSoqlModelToSoql(soqlModel: Soql.Query): string {
  const serializer = new ModelSerializer(soqlModel);
  const query = serializer.serialize();
  return query;
}
