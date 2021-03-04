#!/usr/bin/env node
const shell = require('shelljs');
const path = require('path');
const cwd = process.cwd();
const srcPath = path.join(cwd, 'soql-parser.lib');
const destPath = path.join(cwd, 'lib', 'soql-parser');

shell.set('-e');
shell.set('+v');
shell.cp('-R', srcPath, destPath);
