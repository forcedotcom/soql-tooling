/*
 *  Copyright (c) 2021, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */
export enum SObjectType {
  Address = 'address',
  AnyType = 'anytype',
  Base64 = 'base64',
  Boolean = 'boolean',
  Combobox = 'combobox',
  ComplexValue = 'complexvalue',
  Currency = 'currency',
  Date = 'date',
  DateTime = 'datetime',
  Double = 'double',
  Email = 'email',
  EncryptedString = 'encryptedstring',
  Id = 'id',
  Integer = 'int',
  Location = 'location',
  Long = 'long',
  MultiPicklist = 'multipicklist',
  Percent = 'percent',
  Phone = 'phone',
  Picklist = 'picklist',
  Reference = 'reference',
  String = 'string',
  TextArea = 'textarea',
  Time = 'time',
  Url = 'url'
}

export class SObjectTypeUtils {
  constructor(protected sobjectMetadata: any) {
  }

  public getType(fieldName: string): SObjectType {
    let type = SObjectType.AnyType;

    if (this.sobjectMetadata.fields && Array.isArray(this.sobjectMetadata.fields)) {
      let matchedField = this.sobjectMetadata.fields.filter(field =>
        (field.name && field.name.toLowerCase() === fieldName.toLowerCase())
      );
      if (matchedField.length === 1 && matchedField[0].type) {
        for (const key of Object.keys(SObjectType)) {
          if (SObjectType[key] === matchedField[0].type.toLowerCase()) {
            type = SObjectType[key];
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
