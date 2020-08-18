import { ToolingModelService, ToolingModelJson } from './toolingModelService';
describe('Tooling Model Service', () => {
  let modelService: ToolingModelService;
  let mockField1 = 'field1';
  let mockField2 = 'field2';
  let mockSobject = 'sObject1';
  let query: ToolingModelJson;

  function checkForEmptyModel() {
    let toolingModel = modelService.getModel().toJS();
    expect(toolingModel.sObject).toEqual('');
    expect(toolingModel.fields.length).toBe(0);
  }

  beforeEach(() => {
    modelService = new ToolingModelService();
    checkForEmptyModel();

    modelService.query.subscribe((val) => {
      query = val;
    });
  });

  it('can set an SObject selection', () => {
    modelService.setSObject(mockSobject);

    expect(query!.sObject).toBe(mockSobject);
  });

  it('can Add, Delete Fields', () => {
    // Add
    modelService.addField(mockField1);
    modelService.addField(mockField2);
    expect(query!.fields.length).toBe(2);
    expect(query!.fields).toContain(mockField1);
    expect(query!.fields).toContain(mockField2);
    // Delete
    modelService.removeField(mockField1);
    expect(query!.fields.length).toBe(1);
    expect(query!.fields).toContain(mockField2);
  });
});
