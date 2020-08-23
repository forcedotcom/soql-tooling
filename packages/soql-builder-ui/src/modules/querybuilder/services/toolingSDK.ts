/* 
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *   
 */

import { mockMDT } from './mockMetadata';

export class ToolingSDK {
  public sObjects: string[];

  constructor() {
    this.sObjects = this.getSObjectDefinitions();
  }

  getSObjectDefinitions() {
    // return the possible sObject names
    return mockMDT.sObjects;
  }

  getCompletionItemsFor(sObject: string): string[] {
    // use object name to return list of fields
    const fieldsInObject = mockMDT.fields[sObject] as string[];

    return fieldsInObject ? fieldsInObject : [];
  }
}
