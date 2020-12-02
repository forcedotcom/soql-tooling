import { ToolingModelJson, ToolingModelService } from './toolingModelService';
import { JsonMap } from '@salesforce/ts-types';

export interface TelemetryModelJson extends JsonMap {
  fields: number;
  orderBy: number;
  limit: number;
  errors: JsonMap[];
  unsupported: string[];
}

export function createQueryTelemetry(query: ToolingModelJson) {

  const telemetry = { ...ToolingModelService.toolingModelTemplate } as JsonMap;
  telemetry.sObject = query.sObject.indexOf('__c') > -1 ? 'custom' : 'standard';
  telemetry.fields = query.fields.length.toString();
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
return telemetry;
}
