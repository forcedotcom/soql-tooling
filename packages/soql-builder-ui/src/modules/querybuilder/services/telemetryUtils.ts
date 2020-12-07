import { ToolingModelJson, ToolingModelService } from './toolingModelService';
import { JsonMap } from '@salesforce/ts-types';

export interface TelemetryModelJson extends JsonMap {
  sObject: string;
  fields: number;
  orderBy: number;
  limit: string;
  errors: number;
  unsupported: number;
}

export function createQueryTelemetry(
  query: ToolingModelJson
): TelemetryModelJson {
  const telemetry = {} as TelemetryModelJson;
  telemetry.sObject = query.sObject.indexOf('__c') > -1 ? 'custom' : 'standard';
  telemetry.fields = query.fields.length;
  telemetry.orderBy = query.orderBy.length;
  telemetry.limit = query.limit;
  telemetry.errors = query.errors.length;
  telemetry.unsupported = query.unsupported.length;
  return telemetry;
}
