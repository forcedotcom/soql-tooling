/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  TextDocumentChangeEvent,
  InitializeResult,
  Diagnostic,
} from 'vscode-languageserver';
import { debounce } from 'debounce';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Validator } from './validator';

// Create a connection for the server, using Node's IPC as a transport.
let connection = createConnection(ProposedFeatures.all);
connection.sendNotification('soql/validate', 'createConnection');

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full, // sync full document for now
    },
  };
  return result;
});

documents.onDidChangeContent(async (change) => {
  let diagnostics = Validator.validateSoqlText(change.document);
  // clear syntax errors immediatly (don't wait on http call)
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });

  if (diagnostics.length === 0) {
    debounceValidateLimit0Query(change);
  }
});

const debounceValidateLimit0Query = debounce(runValidateLimit0Query, 1000);

async function runValidateLimit0Query(
  change: TextDocumentChangeEvent<TextDocument>
) {
  connection.console.log(`validate SOQL query:\n${change.document.getText()}`);
  let diagnostics: Diagnostic[] = [];
  diagnostics = await Validator.validateLimit0Query(
    change.document,
    connection
  );
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
}

documents.listen(connection);

connection.listen();
