/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { SOQLParser } from '@salesforce/soql-parser';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { RequestTypes, RunQueryResponse } from './index';
import { Connection } from 'vscode-languageserver';

const findLimitRegex = new RegExp(/LIMIT\s+\d+\s*$/, 'i');
const findPositionRegex = new RegExp(
  /ERROR at Row:(?<row>\d+):Column:(?<column>\d+)/
);
const findCauseRegex = new RegExp(/'(?<cause>\S+)'/);

export interface RunQuerySuccessResponse {
  done: boolean;
  records: any[];
  totalSize: number;
}
export interface RunQueryErrorResponse {
  name: string;
  errorCode: string;
  message: string;
}

export class Validator {
  public static validateSoqlText(textDocument: TextDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const parser = SOQLParser({
      isApex: true,
      isMultiCurrencyEnabled: true,
      apiVersion: 50.0,
    });
    const result = parser.parseQuery(textDocument.getText());
    if (!result.getSuccess()) {
      result.getParserErrors().forEach((error) => {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: textDocument.positionAt(
              error.getToken()?.startIndex as number
            ),
            end: textDocument.positionAt(error.getToken()?.stopIndex as number),
          },
          message: error.getMessage(),
          source: 'soql',
        });
      });
    }
    return diagnostics;
  }

  public static async validateLimit0Query(
    textDocument: TextDocument,
    connection: Connection
  ) {
    const diagnostics: Diagnostic[] = [];
    const response = (await connection.sendRequest(
      RequestTypes.RunQuery,
      appendLimit0(textDocument.getText())
    )) as RunQueryResponse;
    if (response.error) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range:
          extractErrorRange(response.error.message) ||
          documentRange(textDocument),
        message: response.error.message,
        source: 'soql',
      });
    }
    return diagnostics;
  }
}

function appendLimit0(query: string): string {
  if (findLimitRegex.test(query)) {
    query = query.replace(findLimitRegex, 'LIMIT 0');
  } else {
    query = `${query} LIMIT 0`;
  }
  return query;
}

function extractErrorRange(errorMessage: string): Range | null {
  const posMatch = errorMessage.match(findPositionRegex);
  if (posMatch && posMatch.groups) {
    const line = Number(posMatch.groups.row) - 1;
    const character = Number(posMatch.groups.column) - 1;
    const causeMatch = errorMessage.match(findCauseRegex);
    const cause =
      (causeMatch && causeMatch.groups && causeMatch.groups.cause) || ' ';
    return {
      start: { line, character },
      end: { line, character: character + cause.length },
    };
  } else {
    return null;
  }
}

function documentRange(textDocument: TextDocument): Range {
  return {
    start: { line: 0, character: 0 },
    end: { line: textDocument.lineCount, character: 0 },
  };
}
