const { jestConfig } = require('lwc-services/lib/config/jestConfig');

module.exports = {
  ...jestConfig,
  testMatch: ['**/*.+(spec|test).(ts|js)'],
  displayName: 'soql-builder-ui',
  verbose: true,
  preset: '@lwc/jest-preset'
};
