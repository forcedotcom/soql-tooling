#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var packagePath = '../package.json';
var package = require(packagePath);
var parser = '@salesforce/soql-parser';

delete package.dependencies[parser];
package.bundledDependencies = [parser];

var packageFile = require.resolve(packagePath);
fs.writeFile(packageFile, JSON.stringify(package, null, 2), 'utf8', (err) => {
  if (err) throw err;
  console.log(`bundled ${parser}`);
});
