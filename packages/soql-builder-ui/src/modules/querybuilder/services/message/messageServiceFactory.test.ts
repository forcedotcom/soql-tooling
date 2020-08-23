/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { MessageServiceFactory } from "./messageServiceFactory";
import { StandaloneMessageService } from "./standaloneMessageService";
import { VscodeMessageService } from "./vscodeMessageService";

describe('Message Service Factory', ()=> {

    it('will create message service', () => {
        let messageService = MessageServiceFactory.create();
        expect(messageService).toBeTruthy();
    });

    it('will switch implementation based on vscode', () => {
        // @ts-ignore
        const original = global.acquireVsCodeApi;
        // @ts-ignore
        global.acquireVsCodeApi = undefined;
        let standardMessageService = MessageServiceFactory.create();
        expect(standardMessageService.constructor).toBe(StandaloneMessageService);
        // @ts-ignore
        global.acquireVsCodeApi = original;
        let vscodeMessageService = MessageServiceFactory.create();
        expect(vscodeMessageService.constructor).toBe(VscodeMessageService);
    })
})