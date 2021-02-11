/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SOQLParser } from '@salesforce/soql-parser';
import { SoqlParserVisitor } from '@salesforce/soql-parser/lib/generated/SoqlParserVisitor';
import * as Parser from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { AbstractParseTreeVisitor, ParseTree } from 'antlr4ts/tree';
import { parseHeaderComments } from '../serialization/soqlComments';

export interface Selection {
  selectionQueryText: string;
  queryResultsPath: string[];
  columnName: string;
}
export class SelectAnalyzer {
  protected parseTree: ParseTree;
  constructor(protected queryText: string) {
    const parser = SOQLParser({
      isApex: true,
      isMultiCurrencyEnabled: true,
      apiVersion: 50.0,
    });


    const { headerComments, headerPaddedSoqlText } = parseHeaderComments(
      this.queryText
    );

    const result = parser.parseQuery(headerPaddedSoqlText);
    this.parseTree = result.getParseTree();
  }

  public getSelections() {
    const visitor = new SelectVisitor();
    this.parseTree.accept(visitor);
    return visitor.selections;
  }
}

class SelectVisitor extends AbstractParseTreeVisitor<void> implements SoqlParserVisitor<void> {
  public selections: Selection[] = [];
  protected currentNamespace = '';
  protected currentAggregateExpression = 0;
  protected static AGGREGATEEXPR_PREFIX = 'expr';
  protected isInnerQuery = false;

  public visitSoqlSelectInnerQueryExpr(ctx: Parser.SoqlSelectInnerQueryExprContext): void {
    this.isInnerQuery = true;
    ctx.soqlInnerQuery().accept(this);
    this.isInnerQuery = false;
    this.currentNamespace = '';
  }

  public visitSoqlFromExpr(ctx: Parser.SoqlFromExprContext): void {
    if (this.isInnerQuery) {
      this.currentNamespace = `${ctx.soqlIdentifier()[0].text}.`;
    }
  }

  public visitSoqlInnerQuery(ctx: Parser.SoqlInnerQueryContext): void {
    // visit FROM clause before SELECT clause
    ctx.soqlFromClause().accept(this);
    ctx.soqlSelectClause().accept(this);
  }

  public visitSoqlSelectColumnExpr(ctx: Parser.SoqlSelectColumnExprContext): void {
    const fieldText = ctx.soqlField().text;
    const isAggregateExpression = fieldText.includes('(');
    const aliasText = ctx.soqlAlias()?.text;
    let queryResultsPath: string[] = [];
    if (isAggregateExpression) {
      queryResultsPath.push(aliasText || `${SelectVisitor.AGGREGATEEXPR_PREFIX}${this.currentAggregateExpression}`);
    } else {
      queryResultsPath = `${this.currentNamespace}${fieldText}`.split('.');
    }
    this.selections.push({
      selectionQueryText: fieldText,
      queryResultsPath,
      columnName: aliasText || `${this.currentNamespace}${fieldText}`
    });
    if (isAggregateExpression) {
      this.currentAggregateExpression++;
    }
  }

  protected defaultResult(): void {
  }
}
