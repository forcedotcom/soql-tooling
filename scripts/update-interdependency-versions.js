#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

let packageFiles = process.argv.slice(2);
if(packageFiles.length <= 0) {
  console.log('Usage:\n ./scripts/'+ path.basename(__filename)+' <package.json files>');
  console.log('Example:\n ./scripts/'+path.basename(__filename)+' packages/*/package.json');
  process.exit(1);
}

let package2version = packageFiles.reduce((packagesMap, packageFile) => {
  let package = require('../' + packageFile);
  packagesMap[package.name] = package.version;
  return packagesMap;
}, {});

console.log(package2version);

for (p in packageFiles) {
  let packageFile = packageFiles[p];
  let package = require('../' + packageFile);
  let changed = false;
  for (packageName in package2version) {
    if (
      package.dependencies &&
      package.dependencies[packageName] &&
      package.dependencies[packageName] !== package2version[packageName]
    ) {
      package.dependencies[packageName] = package2version[packageName];
      changed = true;
    }
    if (
      package.devDependencies &&
      package.devDependencies[packageName] &&
      package.devDependencies[packageName] !== package2version[packageName]
    ) {
      package.devDependencies[packageName] = package2version[packageName];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFile(
      packageFile,
      JSON.stringify(package, null, 2),
      'utf8',
      (err) => {
        if (err) throw err;
        console.log(
          `Updated ${packageName} dependency version on ${packageFile}`
        );
      }
    );
  }
}
