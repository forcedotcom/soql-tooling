import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { Validator } from './validator';

// Create a connection for the server, using Node's IPC as a transport.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full // sync full document for now
		}
	};
	return result;
});

documents.onDidChangeContent(change => {
	const diagnostics = Validator.validateSoqlText(change.document);
	connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

documents.listen(connection);

connection.listen();