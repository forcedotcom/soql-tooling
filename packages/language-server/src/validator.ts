import { SOQLParser } from '@salesforce/soql-parser';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class Validator {
    public static validateSoqlText(textDocument: TextDocument): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const parser = SOQLParser({isApex: true, isMultiCurrencyEnabled: true, apiVersion: 50.0});
        const result = parser.parseQuery(textDocument.getText());
        if (!result.getSuccess()) {
            result.getParserErrors().forEach(error => {
                diagnostics.push({
                    severity: DiagnosticSeverity.Error,
                    range: {
                        start: textDocument.positionAt(error.getToken()?.start as number),
                        end: textDocument.positionAt(error.getToken()?.stop as number)
                    },
                    message: error.getMessage(),
                    source: 'soql'
                });
            });
        }
        return diagnostics;
    }
}