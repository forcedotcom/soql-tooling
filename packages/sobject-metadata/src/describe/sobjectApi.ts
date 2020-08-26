/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Connection } from '@salesforce/core';
import { RequestInfo } from 'jsforce';
import { SObjectType } from './sobjectService';
import { Z_UNKNOWN } from 'zlib';

// This interface is the same as the SObject interface described in the
// sobjects-faux-generator: https://github.com/forcedotcom/salesforcedx-vscode/blob/develop/packages/salesforcedx-sobjects-faux-generator/src/describe/sObjectDescribe.ts
export interface SObject {
  actionOverrides: any[];
  activateable: boolean;
  childRelationships: ChildRelationship[];
  compactLayoutable: boolean;
  createable: boolean;
  custom: boolean;
  customSetting: boolean;
  deletable: boolean;
  deprecatedAndHidden: boolean;
  feedEnabled: boolean;
  fields: Field[];
  hasSubtypes: boolean;
  isSubtype: boolean;
  keyPrefix: string;
  label: string;
  labelPlural: string;
  layoutable: boolean;
  listviewable?: any;
  lookupLayoutable?: any;
  mergeable: boolean;
  mruEnabled: boolean;
  name: string;
  namedLayoutInfos: any[];
  networkScopeFieldName?: any;
  queryable: boolean;
  recordTypeInfos: RecordTypeInfo[];
  replicateable: boolean;
  retrieveable: boolean;
  searchLayoutable: boolean;
  searchable: boolean;
  supportedScopes: SupportedScope[];
  triggerable: boolean;
  undeletable: boolean;
  updateable: boolean;
  urls: Urls2;
}

export interface ChildRelationship {
  cascadeDelete: boolean;
  childSObject: string;
  deprecatedAndHidden: boolean;
  field: string;
  junctionIdListNames: any[];
  junctionReferenceTo: any[];
  relationshipName: string;
  restrictedDelete: boolean;
}

export interface Field {
  aggregatable: boolean;
  autoNumber: boolean;
  byteLength: number;
  calculated: boolean;
  calculatedFormula?: any;
  cascadeDelete: boolean;
  caseSensitive: boolean;
  compoundFieldName?: any;
  controllerName?: any;
  createable: boolean;
  custom: boolean;
  defaultValue?: boolean;
  defaultValueFormula?: any;
  defaultedOnCreate: boolean;
  dependentPicklist: boolean;
  deprecatedAndHidden: boolean;
  digits: number;
  displayLocationInDecimal: boolean;
  encrypted: boolean;
  externalId: boolean;
  extraTypeInfo?: any;
  filterable: boolean;
  filteredLookupInfo?: any;
  groupable: boolean;
  highScaleNumber: boolean;
  htmlFormatted: boolean;
  idLookup: boolean;
  inlineHelpText?: any;
  label: string;
  length: number;
  mask?: any;
  maskType?: any;
  name: string;
  nameField: boolean;
  namePointing: boolean;
  nillable: boolean;
  permissionable: boolean;
  picklistValues: any[];
  polymorphicForeignKey: boolean;
  precision: number;
  queryByDistance: boolean;
  referenceTargetField?: any;
  referenceTo: string[];
  relationshipName: string;
  relationshipOrder?: any;
  restrictedDelete: boolean;
  restrictedPicklist: boolean;
  scale: number;
  searchPrefilterable: boolean;
  soapType: string;
  sortable: boolean;
  type: string;
  unique: boolean;
  updateable: boolean;
  // eslint-disable-next-line inclusive-language/use-inclusive-words
  writeRequiresMasterRead: boolean;
}

export interface Urls {
  layout: string;
}

export interface RecordTypeInfo {
  active: boolean;
  available: boolean;
  defaultRecordTypeMapping: boolean;
  // eslint-disable-next-line inclusive-language/use-inclusive-words
  master: boolean;
  name: string;
  recordTypeId: string;
  urls: Urls;
}

export interface SupportedScope {
  label: string;
  name: string;
}

export interface Urls2 {
  compactLayouts: string;
  rowTemplate: string;
  approvalLayouts: string;
  uiDetailTemplate: string;
  uiEditTemplate: string;
  defaultValues: string;
  describe: string;
  uiNewRecord: string;
  quickActions: string;
  layouts: string;
  sobject: string;
}

export interface DescribeSObjectResult {
  sObjectName: string;
  result?: SObject;
  timestamp?: string;
}

export enum SObjectCategory {
  ALL = 'ALL',
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM',
}

export type SubRequest = { method: string; url: string };
export type BatchRequest = { batchRequests: SubRequest[] };
export type DescribeResponse = {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
};
export type SubResponse = { statusCode: number; result: SObject };
export type BatchRawResponse = {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
};
export type BatchResponse = { hasErrors: boolean; results: SubResponse[] };

export class SObjectDescribeAPI {
  private readonly connection: Connection;

  // URL constants
  private readonly SERVICESPATH: string = 'services/data';
  // the targetVersion should be consistent with the Cli even if only using REST calls
  private readonly TARGETVERSION = '49.0';
  private readonly VERSIONPREFIX = 'v';
  private readonly SOBJECTS: string = 'sobjects';
  private readonly BATCH: string = 'composite/batch';
  private readonly DESCRIBE: string = 'describe';

  private readonly CLIENT_ID: string = 'sfdx-vscode';

  private readonly commonHeaders = {
    'User-Agent': 'salesforcedx-extension',
    'Sforce-Call-Options': `client=${this.CLIENT_ID}`,
  };

  public constructor(connection: Connection) {
    this.connection = connection;
  }

  public async describeSObject(
    sObjectName: string,
    lastRefreshDate?: string
  ): Promise<DescribeSObjectResult> {
    try {
      let response: DescribeResponse;
      let options: RequestInfo;
      options = this.buildSingleXHROptions(sObjectName, lastRefreshDate);
      response = ((await this.connection.requestRaw(
        options
      )) as unknown) as DescribeResponse;

      const sObject = response.body
        ? (JSON.parse(response.body) as SObject)
        : undefined;

      return Promise.resolve({
        sObjectName,
        result: sObject,
        timestamp: response.headers['date'],
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorMsg =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'responseText' in error ? error.responseText : error.message;
      return Promise.reject(errorMsg);
    }
  }

  public async describeSObjectBatch(
    types: string[],
    nextToProcess: number
  ): Promise<DescribeSObjectResult[]> {
    try {
      let response: BatchRawResponse;
      let options: RequestInfo;
      options = this.buildBatchXHROptions(types, nextToProcess);
      response = ((await this.connection.requestRaw(
        options
      )) as unknown) as BatchRawResponse;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const timestamp: string = response.headers['date'];
      const batchResponse = JSON.parse(response.body) as BatchResponse;
      const fetchedObjects: DescribeSObjectResult[] = [];
      let i = nextToProcess;
      for (const sr of batchResponse.results) {
        if (sr.result instanceof Array) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (sr.result[0].errorCode && sr.result[0].message) {
            // eslint-disable-next-line
            console.log(`Error: ${sr.result[0].message} - ${types[i]}`);
          }
        }
        i++;
        fetchedObjects.push({
          sObjectName: sr.result.name,
          result: sr.result,
          timestamp,
        });
      }
      return Promise.resolve(fetchedObjects);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorMsg =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'responseText' in error ? error.responseText : error.message;
      return Promise.reject(errorMsg);
    }
  }

  protected buildSObjectDescribeURL(
    sObjectName: string,
    fullUrl?: boolean
  ): string {
    const urlElements = [];
    if (fullUrl) {
      urlElements.push(this.connection.instanceUrl, this.SERVICESPATH);
    }
    urlElements.push(
      this.getVersion(),
      this.SOBJECTS,
      sObjectName,
      this.DESCRIBE
    );
    return urlElements.join('/');
  }

  protected buildBatchRequestURL(): string {
    const batchUrlElements = [
      this.connection.instanceUrl,
      this.SERVICESPATH,
      this.getVersion(),
      this.BATCH,
    ];
    return batchUrlElements.join('/');
  }

  protected buildBatchRequestBody(
    types: string[],
    nextToProcess: number
  ): BatchRequest {
    const batchSize = 25;
    const batchRequest: BatchRequest = { batchRequests: [] };

    for (
      let i = nextToProcess;
      i < nextToProcess + batchSize && i < types.length;
      i++
    ) {
      batchRequest.batchRequests.push({
        method: 'GET',
        url: this.buildSObjectDescribeURL(types[i]),
      });
    }

    return batchRequest;
  }

  protected buildSingleXHROptions(
    sObjectName: string,
    lastRefreshDate?: string
  ): RequestInfo {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let additionalHeaders: any = {};
    if (lastRefreshDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      additionalHeaders = {
        'If-Modified-Since': lastRefreshDate,
      };
    }
    return {
      method: 'GET',
      url: this.buildSObjectDescribeURL(sObjectName, true),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      headers: {
        ...this.commonHeaders,
        ...additionalHeaders,
      },
    };
  }

  protected buildBatchXHROptions(
    types: string[],
    nextToProcess: number
  ): RequestInfo {
    const batchRequest = this.buildBatchRequestBody(types, nextToProcess);
    return {
      method: 'POST',
      url: this.buildBatchRequestURL(),
      headers: {
        ...this.commonHeaders,
      },
      body: JSON.stringify(batchRequest),
    };
  }

  protected getVersion(): string {
    return `${this.VERSIONPREFIX}${this.TARGETVERSION}`;
  }
}
