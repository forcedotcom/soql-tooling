#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var packagePath = '../package.json';
var package = require(packagePath);
var parser = '@salesforce/soql-parser';
var tarballPath = 'file:../../Dependencies/salesforce-soql-parser-0.17.0.tgz';

delete package.bundledDependencies;
package.dependencies[parser] = tarballPath;

var packageFile = require.resolve(packagePath);
fs.writeFile(packageFile, JSON.stringify(package, null, 2), 'utf8', (err) => {
  if (err) throw err;
  console.log(`unbundled ${parser}`);
});
