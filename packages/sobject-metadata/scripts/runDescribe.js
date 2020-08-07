#!/usr/bin/env node

// sample script for how to use SObjectDescriptAPI.describeObject() function

var api = require("../lib/describe/sobjectApi");
var sfcore = require("@salesforce/core");

var username = "[user name]";
var sObjectName = "[object name]";
var timestamp = "[last refresh timestamp]";
sfcore.AuthInfo.create({ username })
  .then((authInfo) => {
    sfcore.Connection.create({ authInfo }).then((connection) => {
      sfcore.Org.create({ connection }).then((org) => {
        new api.SObjectDescribeAPI(org)
          .describeSObject(sObjectName, timestamp)
          .then((result) => {
            console.log(JSON.stringify(result));
          })
          .catch((error) => {
            console.log(error);
          });
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
