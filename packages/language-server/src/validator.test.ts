/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { Validator } from './validator';
import { TextDocument } from 'vscode-languageserver-textdocument';

describe('Validator returns', () => {
    it('empty diagnostics for a valid SOQL query', () => {
        const diagnostics = Validator.validateSoqlText(TextDocument.create('some-uri', 'soql', 0.1, 'SeLeCt Id FrOm Account Ac'));
        expect(diagnostics.length).toEqual(0);
    });
    it('populated diagnostics for a SOQL query with errors', () => {
        const diagnostics = Validator.validateSoqlText(TextDocument.create('some-uri', 'soql', 0.1, 'SeLeCt Id FrOm'));
        expect(diagnostics.length).toEqual(1);
    })
});