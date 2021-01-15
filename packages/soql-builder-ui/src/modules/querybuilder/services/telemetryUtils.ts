import { ToolingModelJson } from './model';
import { JsonMap } from '@salesforce/ts-types';

export interface TelemetryModelJson extends JsonMap {
  sObject: string;
  fields: number;
  orderBy: number;
  limit: string;
  errors: string[];
  unsupported: string[];
}

export function createQueryTelemetry(
  query: ToolingModelJson
): TelemetryModelJson {
  const telemetry = {} as TelemetryModelJson;
  telemetry.sObject = query.sObject.indexOf('__c') > -1 ? 'custom' : 'standard';
  telemetry.fields = query.fields.length;
  telemetry.orderBy = query.orderBy.length;
  telemetry.limit = query.limit;
  telemetry.errors = query.errors.map(
    (err) => `${err.type}:${err.grammarRule}`
  );
  telemetry.unsupported = query.unsupported.map((unsup) => unsup.reason);
  return telemetry;
}
