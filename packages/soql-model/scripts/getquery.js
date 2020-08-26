#!/usr/bin/env node

// sample script for how to get SOQL script from fields and sobject

var model = require('../lib');

var sobjectName = 'object1';
var fields = ['field1', 'field2'];
var selectExprs = fields.map((field) => new model.Impl.FieldRefImpl(field));
var queryModel = new model.Impl.QueryImpl(
  new model.Impl.SelectExprsImpl(selectExprs),
  new model.Impl.FromImpl(sobjectName)
);
var serializer = new model.ModelSerializer(queryModel);
var query = serializer.serialize();
console.log(`Model:\n------\n${JSON.stringify(queryModel)}\n------------`);
console.log(`Query:\n------\n${query}`);
