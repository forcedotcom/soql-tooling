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
import { parseHeaderComments, SoqlWithComments } from './soqlComments';

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
    const result = parser.parseQuery(
      parseHeaderComments(textDocument.getText()).headerPaddedSoqlText
    );
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
    const soqlWithHeaderComments = parseHeaderComments(textDocument.getText());

    const response = (await connection.sendRequest(
      RequestTypes.RunQuery,
      appendLimit0(soqlWithHeaderComments.soqlText)
    )) as RunQueryResponse;
    if (response.error) {
      const {errorMessage, errorRange } = extractErrorRange(soqlWithHeaderComments, response.error.message);
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range:
          errorRange ||
          documentRange(textDocument),
        message: errorMessage,
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

function extractErrorRange(
  soqlWithComments: SoqlWithComments,
  errorMessage: string
): { errorRange: Range | undefined; errorMessage: string } {
  const posMatch = errorMessage.match(findPositionRegex);
  if (posMatch && posMatch.groups) {
    const line =
      Number(posMatch.groups.row) - 1 + soqlWithComments.commentLineCount;
    const character = Number(posMatch.groups.column) - 1;
    const causeMatch = errorMessage.match(findCauseRegex);
    const cause =
      (causeMatch && causeMatch.groups && causeMatch.groups.cause) || ' ';
    return {
      // Strip out the line and column information from the error message
      errorMessage: errorMessage.replace(findPositionRegex, 'Error:'),
      errorRange: {
            start: { line, character },
            end: { line, character: character + cause.length },
          },
    };
  } else {
    return { errorMessage: errorMessage, errorRange: undefined };
  }
}

function documentRange(textDocument: TextDocument): Range {
  return {
    start: { line: 0, character: 0 },
    end: { line: textDocument.lineCount, character: 0 },
  };
}
