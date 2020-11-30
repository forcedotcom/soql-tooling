const query = {
  sobject: 'hello',
  fields: ['one', 'two', 'three'],
  orderBy: [{ field: 'one', nulls: 'first', order: 'desc' }],
  limit: '1234',
};

let telemetry = {
  sObject: '',
  fields: [],
  orderBy: [],
  limit: '',
  errors: [],
  unsupported: [],
  originalSoqlStatement: '',
};
telemetry.sobject = query.sobject.indexOf('__c') ? 'custom' : 'standard';
telemetry.fields = query.fields.length;
telemetry.orderBy = query.orderBy.map((orderBy) => {
  // handle this later
});
