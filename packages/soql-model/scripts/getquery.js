#!/usr/bin/env node

// sample script for how to get SOQL script from fields and sobject

var model = require('../lib');
const { UnmodeledSyntaxImpl, NullsOrder, Order } = require('../lib/model/impl');

var sobjectName = 'object1';
var fields = ['field1', 'field2'];
var selectExprs = fields.map((field) => new model.Impl.FieldRefImpl(field));
var queryModel = new model.Impl.QueryImpl(
  new model.Impl.SelectExprsImpl(selectExprs),
  new model.Impl.FromImpl(sobjectName),
  new model.Impl.UnmodeledSyntaxImpl('WHERE field1 = 5'),
  new model.Impl.OrderByExpressionImpl(
    new model.Impl.FieldRefImpl('shattered'),
    model.Soql.Order.Ascending,
    model.Soql.NullsOrder.First
  )
);
var serializer = new model.ModelSerializer(queryModel);
var query = serializer.serialize();
console.log(`Model:\n------\n${JSON.stringify(queryModel)}\n------------`);
console.log(`Query:\n------\n${query}`);
