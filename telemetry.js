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
telemetry.sobject = query.sobject.indexOf('__c') > -1 ? 'custom' : 'standard';
telemetry.fields = query.fields.length;
telemetry.orderBy = query.orderBy.map((orderBy) => {
  return {
    field: orderBy.field.indexOf('__c') > -1 ? 'custom' : 'standard',
    nulls: orderBy.nulls,
    order: orderBy.order,
  };
});
telemetry.limit = query.limit;
telemetry.errors = query.errors;
telemetry.unsupported = query.unsupported;
delete telemetry.originalSoqlStatement;

console.log(JSON.stringify(telemetry));
