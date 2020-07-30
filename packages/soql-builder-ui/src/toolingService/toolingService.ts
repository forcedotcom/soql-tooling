import { mockMDT } from './mockMetadata';

export class ToolingService {
  public sObjects: string[];
  //   private TOOLING_MODEL: object = {
  //     query: {
  //       sObject: {
  //         value: ''
  //       },
  //       fields: {
  //         value: []
  //       }
  //     }
  //   };

  constructor() {
    this.sObjects = this.getSObjectDefinitions();
  }

  getSObjectDefinitions() {
    // return the possible sObject names
    return mockMDT.sObjects;
  }

  getCompletionItems(sObject: string): string[] {
    // use object name to return list of fields
    // @ts-ignore
    const fieldsInObject = mockMDT.fields[sObject];

    return fieldsInObject
      ? fieldsInObject
      : [`could not get fields for ${sObject}`];
  }

  upDateFields() {}
}
