/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Org } from '@salesforce/core';
import {
  DescribeSObjectResult,
  SObject,
  SObjectDescribeAPI,
} from './sobjectApi';

export enum SObjectType {
  ALL,
  STANDARD,
  CUSTOM,
}

export class SObjectService {
  public readonly org: Org;

  public constructor(org: Org) {
    this.org = org;
  }

  public async describeSObject(name: string): Promise<SObject> {
    const result = await new SObjectDescribeAPI(this.org).describeSObject(name);
    if (result.result) {
      return Promise.resolve(result.result);
    }
    return Promise.reject();
  }

  public async describeSObjects(names: string[]): Promise<SObject[]> {
    // TODO: make cancellable?
    const describeAPI = new SObjectDescribeAPI(this.org);
    let fetchedResults: DescribeSObjectResult[] = [];
    let j = 0;
    while (j < names.length) {
      try {
        fetchedResults = fetchedResults.concat(
          await describeAPI.describeSObjectBatch(names, j)
        );
        j = fetchedResults.length;
      } catch (error) {
        return Promise.reject(error);
      }
    }
    const fetchedSObjects: SObject[] = [];
    fetchedResults.forEach((result) => {
      if (result.result) {
        fetchedSObjects.push(result.result);
      }
    });
    return fetchedSObjects;
  }

  public async retrieveSObjectNames(
    type: SObjectType = SObjectType.ALL
  ): Promise<string[]> {
    const sobjectNames: string[] = [];
    const describeResult = await this.org.getConnection().describeGlobal();
    describeResult.sobjects.forEach((sobject) => {
      if (
        type === SObjectType.ALL ||
        (type === SObjectType.CUSTOM && sobject.custom === true) ||
        (type === SObjectType.STANDARD && sobject.custom !== true)
      ) {
        sobjectNames.push(sobject.name);
      }
    });
    return sobjectNames;
  }
}
