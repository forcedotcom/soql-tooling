/*
 *  Copyright (c) 2021, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { Soql } from '@salesforce/soql-model';

interface SObjectField {
  name: string;
  type: string;
  picklistValues: string[];
}

export class SObjectTypeUtils {
  protected fieldMap: { [key: string]: SObjectField };
  protected typeMap: { [key: string]: Soql.SObjectFieldType };
  constructor(protected sobjectMetadata: any) {
    this.fieldMap = {};
    if (sobjectMetadata && sobjectMetadata.fields && Array.isArray(sobjectMetadata.fields)) {
      sobjectMetadata.fields.forEach(field => {
        this.fieldMap[field.name.toLowerCase()] = {
          name: field.name,
          type: field.type,
          picklistValues: (field.picklistValues && Array.isArray(field.picklistValues))
            ? field.picklistValues.map(picklistValue => picklistValue.value)
            : []
        }
      });
    }
    this.typeMap = {};
    Object.keys(Soql.SObjectFieldType).forEach(key => {
      this.typeMap[Soql.SObjectFieldType[key].toLowerCase()] = Soql.SObjectFieldType[key];
    })
  }

  public getType(fieldName: string): Soql.SObjectFieldType {
    let type = Soql.SObjectFieldType.AnyType;
    const field = this.fieldMap[fieldName.toLowerCase()];
    if (field) {
      const fieldType = this.typeMap[field.type.toLowerCase()];
      if (fieldType) {
        type = fieldType;
      }
    }
    return type;
  }

  public getPicklistValues(fieldName: string): string[] {
    const field = this.fieldMap[fieldName.toLowerCase()];
    return field ? field.picklistValues : [];
  }
}
