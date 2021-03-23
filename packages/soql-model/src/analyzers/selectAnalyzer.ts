/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SOQLParser } from '@salesforce/soql-common/lib/soql-parser';
import { SoqlParserVisitor } from '@salesforce/soql-common/lib/soql-parser/generated/SoqlParserVisitor';
import * as Parser from '@salesforce/soql-common/lib/soql-parser/generated/SoqlParser';
import { AbstractParseTreeVisitor, ParseTree } from 'antlr4ts/tree';
import { soqlComments } from '@salesforce/soql-common';

export interface Selection {
  selectionQueryText: string;
  queryResultsPath: string[];
  objectName: string;
  columnName: string;
  isSubQuerySelection: boolean;
}

export interface ColumnData {
  objectName: string;
  columns: Column[];
  subTables: ColumnData[];
}

export interface Column {
  title: string;
  fieldHelper: string[];
}
export class SelectAnalyzer {
  protected parseTree: ParseTree;
  constructor(protected queryText: string) {
    const parser = SOQLParser({
      isApex: true,
      isMultiCurrencyEnabled: true,
      apiVersion: 50.0
    });

    const {
      headerComments,
      headerPaddedSoqlText
    } = soqlComments.parseHeaderComments(this.queryText);

    const result = parser.parseQuery(headerPaddedSoqlText);
    this.parseTree = result.getParseTree();
  }

  public getSelections(): Selection[] {
    const visitor = new SelectVisitor();
    this.parseTree.accept(visitor);
    return visitor.selections;
  }

  public getColumnData(): ColumnData {
    const selections = this.getSelections();
    const columnData = {
      objectName: '',
      columns: new Array<Column>(),
      subTables: new Array<ColumnData>()
    };
    selections.forEach((selection) => {
      if (selection.isSubQuerySelection) {
        let subTable = columnData.subTables.find(
          (data: ColumnData) => data.objectName === selection.objectName
        );
        if (!subTable) {
          subTable = {
            objectName: selection.objectName,
            columns: [],
            subTables: []
          };
          columnData.subTables.push(subTable);
        }
        subTable.columns.push({
          title: selection.columnName,
          fieldHelper: selection.queryResultsPath
        });
      } else {
        columnData.objectName = selection.objectName;
        columnData.columns.push({
          title: selection.columnName,
          fieldHelper: selection.queryResultsPath
        });
      }
    });
    return columnData;
  }
}

class SelectVisitor
  extends AbstractParseTreeVisitor<void>
  implements SoqlParserVisitor<void> {
  public selections: Selection[] = [];
  protected currentNamespace = '';
  protected currentObjectName = '';
  protected currentAggregateExpression = 0;
  protected static AGGREGATEEXPR_PREFIX = 'expr';
  protected isInnerQuery = false;

  public visitSoqlSelectInnerQueryExpr(
    ctx: Parser.SoqlSelectInnerQueryExprContext
  ): void {
    this.isInnerQuery = true;
    ctx.soqlInnerQuery().accept(this);
    this.isInnerQuery = false;
    this.currentNamespace = '';
    this.currentObjectName = '';
  }

  public visitSoqlFromExpr(ctx: Parser.SoqlFromExprContext): void {
    this.currentObjectName = ctx.soqlIdentifier()[0].text;
    if (this.isInnerQuery) {
      this.currentNamespace = `${this.currentObjectName}.`;
    }
  }

  public visitSoqlInnerQuery(ctx: Parser.SoqlInnerQueryContext): void {
    // visit FROM clause before SELECT clause
    ctx.soqlFromClause().accept(this);
    ctx.soqlSelectClause().accept(this);
  }

  public visitSoqlSelectColumnExpr(
    ctx: Parser.SoqlSelectColumnExprContext
  ): void {
    const fieldText = ctx.soqlField().text;
    const isAggregateExpression = fieldText.includes('(');
    const aliasText = ctx.soqlAlias()?.text;
    let queryResultsPath: string[] = [];
    if (isAggregateExpression) {
      queryResultsPath.push(
        aliasText ||
          `${SelectVisitor.AGGREGATEEXPR_PREFIX}${this.currentAggregateExpression}`
      );
    } else {
      queryResultsPath = `${fieldText}`.split('.');
    }
    this.selections.push({
      selectionQueryText: fieldText,
      queryResultsPath,
      objectName: this.currentObjectName,
      columnName: aliasText || `${this.currentNamespace}${fieldText}`,
      isSubQuerySelection: this.isInnerQuery
    });
    if (isAggregateExpression) {
      this.currentAggregateExpression++;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected defaultResult(): void {}
}
