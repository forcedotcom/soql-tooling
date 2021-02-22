#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var glob = require('glob');


let packageFiles = glob.sync('./packages/*/package.json');
let package2version = packageFiles.reduce((packagesMap, packageFile) => {
  let package = require('../' + packageFile);
  packagesMap[package.name] = package.version;
  return packagesMap;
}, {});

console.log(package2version);

for (p in packageFiles) {
  let packageFile = packageFiles[p];
  let package = require('../' + packageFile);
  for (packageName in package2version) {
    if (
      package.dependencies &&
      package.dependencies[packageName] &&
      package.dependencies[packageName] !== package2version[packageName]
    ) {
      package.dependencies[packageName] = package2version[packageName];
      fs.writeFile(
        packageFile,
        JSON.stringify(package, null, 2),
        'utf8',
        (err) => {
          if (err) throw err;
          console.log(
            `updated ${packageName} dependency version on ${packageFile}`
          );
        }
      );
    }
  }
}

