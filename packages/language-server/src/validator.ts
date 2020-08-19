/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

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