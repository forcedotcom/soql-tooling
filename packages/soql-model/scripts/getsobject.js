#!/usr/bin/env node

// sample script for how to get SObject name and fields from a query string

var model = require('../lib');

var query = 'SELECT field1, field2 FROM object1';
var deserializer = new model.ModelDeserializer(query);
var queryModel = deserializer.deserialize();
var fields = queryModel.select.selectExpressions.map((expr) => expr.fieldName);
var sObject = queryModel.from.sobjectName;
console.log(`Query:   ${query}`);
console.log(`SObject: ${sObject}`);
console.log(`Fields:  ${fields}`);
