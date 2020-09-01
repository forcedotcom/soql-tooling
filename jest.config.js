const BASE = require('./jest.config.base');

module.exports = {
  projects: [
    {
      ...BASE,
      displayName: 'language-server',
      rootDir: '<rootDir>/packages/language-server',
    },
    {
      ...BASE,
      displayName: 'sobject-metadata',
      rootDir: '<rootDir>/packages/sobject-metadata',
    },
    {
      displayName: 'soql-builder-ui',
      rootDir: '<rootDir>/packages/soql-builder-ui',
      preset: '@lwc/jest-preset',
    },
    {
      ...BASE,
      displayName: 'soql-model',
      rootDir: '<rootDir>/packages/soql-model',
    },
  ],
};
