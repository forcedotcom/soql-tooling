import { mockMDT } from './mockMetadata';

export class ToolingService {
  public sObjects: string[];
  public model: object;

  constructor() {
    this.sObjects = this.getSObjectDefinitions();
    this.model = {
      query: {
        sObject: {
          value: ''
        },
        fields: {
          value: []
        }
      }
    };
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

  upDateModel() {
    // take the state from LWC components and store in this.model
  }
}
