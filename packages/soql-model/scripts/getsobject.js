#!/usr/bin/env node

// sample script for how to get SObject name and fields from a query string

var model = require('../lib');

var query =
  "SELECT field1, field2 FROM object1 WHERE field1='Hello' AND field2 < 1 ORDER BY field1 DESC NULLS LAST, field2 ASC NULLS FIRST";
// var query =
//   'SELECT field1, field2, field3 alias3, (SELECT fieldA FROM objectA), TYPEOF obj WHEN typeX THEN fieldX ELSE fieldY END FROM object1 ' +
//   'WHERE field1 = 5 WITH DATA CATEGORY cat__c AT val__c GROUP BY field1 ORDER BY field2 DESC NULLS LAST LIMIT 20 OFFSET 2 BIND field1 = 5 FOR VIEW UPDATE TRACKING';
//var query = 'SELECT FROM object1';
//var query = 'SELECT field1 FROM object1 WHERE OR field = 5';

var deserializer = new model.ModelDeserializer(query);
var queryModel = deserializer.deserialize();
var fields =
  queryModel.select && queryModel.select.selectExpressions
    ? queryModel.select.selectExpressions
        .filter((expr) => !model.SoqlModelUtils.containsUnmodeledSyntax(expr))
        .map((expr) => expr.field.fieldName)
    : undefined;
var sObject = queryModel.from ? queryModel.from.sobjectName : undefined;
var errors = queryModel.errors;
var where = queryModel.where ? queryModel.where.toSoqlSyntax() : undefined;
var orderBy = queryModel.orderBy
  ? queryModel.orderBy.orderByExpressions.map(
      (expr) => `${expr.field.fieldName} ${expr.order} ${expr.nullsOrder}`
    )
  : [];
var limit = queryModel.limit ? queryModel.limit.limit : 'undefined';
console.log(`Query:    ${query}`);
console.log(`SObject:  ${sObject}`);
console.log(`Fields:   ${fields}`);
console.log(`Where:    ${where}`);
console.log(`Order By: ${orderBy}`);
console.log(`Limit:    ${limit}`);
console.log(`Errors:   ${JSON.stringify(errors)}`);
