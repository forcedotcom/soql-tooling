import { createQueryTelemetry } from './telemetryUtils';
import { ToolingModelJson } from './toolingModelService';

describe('Telemetry Utils', () => {
  const query = ({
    sObject: 'account',
    fields: ['Id', 'Name'],
    orderBy: [{ field: 'Name', nulls: 'first', order: 'desc' }],
    limit: '1234',
    errors: ['one error'],
    unsupported: ['WHERE name = 1234']
  } as unknown) as ToolingModelJson;
  it('should create telemetry model from soql model', () => {
    const telemetry = createQueryTelemetry(query);
    expect(telemetry.sObject).toEqual('standard');
    expect(telemetry.fields).toEqual(query.fields.length);
    expect(telemetry.orderBy).toEqual(query.orderBy.length);
    expect(telemetry.errors).toEqual(query.errors.length);
    expect(telemetry.unsupported).toEqual(query.unsupported.length);
  });
});
