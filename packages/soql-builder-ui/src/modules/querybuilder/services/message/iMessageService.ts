/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { Observable } from 'rxjs';
import { JsonMap } from '@salesforce/ts-types';
import { ToolingModelJson } from '../toolingModelService';

export interface SoqlEditorEvent {
    type: string;
    message: string | ToolingModelJson;
  }

export interface IMessageService {
    message: Observable<SoqlEditorEvent>;
    sendMessage(message: string): void;
    setState(state: JsonMap): void;
    getState(): JsonMap;
}