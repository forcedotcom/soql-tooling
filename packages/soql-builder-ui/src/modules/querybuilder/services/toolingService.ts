import { mockMDT } from './mockMetadata';

export class ToolingService {
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
