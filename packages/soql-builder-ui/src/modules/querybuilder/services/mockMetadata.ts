import { JsonMap } from '@salesforce/ts-types';

interface MockMetadata {
  fields: JsonMap;
  sObjects: string[];
}

export const mockMDT: MockMetadata = {
  fields: {
    Account: [
      'Name',
      'AccountSource',
      'AnnualRevenue',
      'BillingAddress',
      'IsBuyer',
      'CleanStatus',
      'CreatedById',
      'DandbCompanyId',
      'Jigsaw',
      'Industry',
      'Phone'
    ],
    Contact: [
      'AccountId',
      'AssistantName',
      'AssistantPhone',
      'Birthdate',
      'Email',
      'Name',
      'Title'
    ],
    Event: [
      'IsAllDayEvent',
      'Location',
      'IsPrivate',
      'WhatId',
      'Email',
      'Type',
      'LastModifiedById'
    ],
    Order: [
      'AccountId',
      'AccountNumber',
      'BillToContactId',
      'OrderNumber',
      'TotalAmount',
      'Status'
    ],
    CodeBuilder__Workspace__c: [
      'CreatedById',
      'CodeBuilder__Error_State_Info__c',
      'CodeBuilder__Last_Accessed__c',
      'OwnerId',
      'CodeBuilder__Remote_Resource_ID__c',
      'CodeBuilder__Status__c',
      'CodeBuilder__URL__c',
      'Name'
    ],
    CodeBuilder__WorkspaceUsage__c: [
      'CreatedById',
      'LastModifiedById',
      'OwnerId',
      'CodeBuilder__Usage_Quantity__c',
      'CodeBuilder__Workspace_Id__c',
      'Name'
    ]
  },
  sObjects: [
    'Account',
    'Contact',
    'Event',
    'Order',
    'CodeBuilder__Workspace__c',
    'CodeBuilder__WorkspaceUsage__c'
  ]
};
