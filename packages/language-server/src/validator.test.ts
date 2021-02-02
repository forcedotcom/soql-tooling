/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import {
  Validator,
  RunQueryErrorResponse,
  RunQuerySuccessResponse,
} from './validator';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Connection } from 'vscode-languageserver';

function mockSOQLDoc(content: string): TextDocument {
  return TextDocument.create('some-uri', 'soql', 0.1, content);
}

function createMockClientConnection(
  response:
    | { result: RunQuerySuccessResponse }
    | { error: RunQueryErrorResponse }
): Connection {
  return {
    // @ts-ignore
    async sendRequest(method: string, params: any) {
      return response;
    },
  };
}

describe('Validator', () => {
  describe('validateSoqlText', () => {
    it('empty diagnostics for a valid SOQL query', () => {
      const diagnostics = Validator.validateSoqlText(
        mockSOQLDoc('SeLeCt Id FrOm Account Ac')
      );
      expect(diagnostics.length).toEqual(0);
    });
    it('populated diagnostics for a SOQL query with errors', () => {
      const diagnostics = Validator.validateSoqlText(
        mockSOQLDoc('SeLeCt Id FrOm')
      );
      expect(diagnostics.length).toEqual(1);
    });
  });

  describe('validateLimit0Query', () => {
    it('empty diagnostics for a valid SOQL query', async () => {
      const diagnostics = await Validator.validateLimit0Query(
        mockSOQLDoc('SELECT Id FROM Account'),
        createMockClientConnection({
          result: {
            done: true,
            records: [],
            totalSize: 0,
          },
        })
      );
      expect(diagnostics.length).toEqual(0);
    });

    it('creates diagnostic with range when location and cause are returned from API', async () => {
      const serverError = `Oh Snap!\nERROR at Row:1:Column:8\nBlame 'Ids' not 'Me'`;
      const expectedErrorWithoutLineColumn = `Oh Snap!\nError:\nBlame 'Ids' not 'Me'`;
      const diagnostics = await Validator.validateLimit0Query(
        mockSOQLDoc('SELECT Ids FROM Account'),
        createMockClientConnection({
          error: {
            name: 'INVALID_FIELD',
            errorCode: 'INVALID_FIELD',
            message: serverError,
          },
        })
      );
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toEqual(expectedErrorWithoutLineColumn);
      expect(diagnostics[0].range.start.line).toEqual(0);
      expect(diagnostics[0].range.start.character).toEqual(7);
      expect(diagnostics[0].range.end.line).toEqual(0);
      expect(diagnostics[0].range.end.character).toEqual(10);
    });

    it(
      'creates diagnostic with range when location and cause are returned from API' +
        ' when query prefixed by newlines',
      async () => {
        // The Query API seems to be "ignoring" the initial empty lines, so
        // it reports the error lines as starting from the first non-empty line
        const serverError = `Oh Snap!\nERROR at Row:1:Column:8\nBlame 'Ids' not 'Me'`;
        const expectedErrorWithoutLineColumn = `Oh Snap!\nError:\nBlame 'Ids' not 'Me'`;
        const diagnostics = await Validator.validateLimit0Query(
          mockSOQLDoc('\n\n// Comment here\n\nSELECT Ids FROM Account'),
          createMockClientConnection({
            error: {
              name: 'INVALID_FIELD',
              errorCode: 'INVALID_FIELD',
              message: serverError,
            },
          })
        );

        // The expected error line is: the number of empty lines at the top (4),
        // plus the reported error line number (1), minus 1 because this is zero based
        const errorLine = 4;

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toEqual(expectedErrorWithoutLineColumn);
        expect(diagnostics[0].range.start.line).toEqual(errorLine);
        expect(diagnostics[0].range.start.character).toEqual(7);
        expect(diagnostics[0].range.end.line).toEqual(errorLine);
        expect(diagnostics[0].range.end.character).toEqual(10);
      }
    );

    it('creates diagnostic with full doc range when location is not found', async () => {
      const expectedError = `Oh Snap!`;
      const diagnostics = await Validator.validateLimit0Query(
        mockSOQLDoc('SELECT Id\nFROM Accounts'),
        createMockClientConnection({
          error: {
            name: 'INVALID_TYPE',
            errorCode: 'INVALID_TYPE',
            message: expectedError,
          },
        })
      );
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toEqual(expectedError);
      expect(diagnostics[0].range.start.line).toEqual(0);
      expect(diagnostics[0].range.start.character).toEqual(0);
      expect(diagnostics[0].range.end.line).toEqual(2); // one line greater than doc length
      expect(diagnostics[0].range.end.character).toEqual(0);
    });

    it('creates diagnostic message for errorCode INVALID_TYPE', async () => {
      const expectedError = `Oh Snap!`;
      const diagnostics = await Validator.validateLimit0Query(
        mockSOQLDoc('SELECT Id\nFROM Accounts'),
        createMockClientConnection({
          error: {
            name: 'INVALID_TYPE',
            errorCode: 'INVALID_TYPE',
            message: expectedError,
          },
        })
      );
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toEqual(expectedError);
      expect(diagnostics[0].range.start.line).toEqual(0);
      expect(diagnostics[0].range.start.character).toEqual(0);
      expect(diagnostics[0].range.end.line).toEqual(2); // one line greater than doc length
      expect(diagnostics[0].range.end.character).toEqual(0);
    });
  });
});
