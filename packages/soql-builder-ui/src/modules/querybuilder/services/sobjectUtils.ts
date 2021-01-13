/*
 *  Copyright (c) 2021, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { Soql } from '@salesforce/soql-model';

export class SObjectTypeUtils {
  constructor(protected sobjectMetadata: any) {
  }

  public getType(fieldName: string): Soql.SObjectFieldType {
    let type = Soql.SObjectFieldType.AnyType;

    if (this.sobjectMetadata.fields && Array.isArray(this.sobjectMetadata.fields)) {
      let matchedField = this.sobjectMetadata.fields.filter(field =>
        (field.name && field.name.toLowerCase() === fieldName.toLowerCase())
      );
      if (matchedField.length === 1 && matchedField[0].type) {
        for (const key of Object.keys(Soql.SObjectFieldType)) {
          if (Soql.SObjectFieldType[key] === matchedField[0].type.toLowerCase()) {
            type = Soql.SObjectFieldType[key];
            break;
          }
        }
      }
    }

    return type;
  }

  public getPicklistValues(fieldName: string): string[] {
    let values = [];

    if (this.sobjectMetadata.fields && Array.isArray(this.sobjectMetadata.fields)) {
      let matchedField = this.sobjectMetadata.fields.filter(field =>
        (field.name && field.name.toLowerCase() === fieldName.toLowerCase())
      );
      if (matchedField.length === 1 && matchedField[0].type) {
        const picklistEntries = matchedField[0].picklistValues;
        if (picklistEntries && Array.isArray(picklistEntries)) {
          values = picklistEntries.map(entry => entry.value);
        }
      }
    }
    return values;
  }
}
