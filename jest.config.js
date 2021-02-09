const BASE = require('./jest.config.base');

module.exports = {
  projects: [
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
