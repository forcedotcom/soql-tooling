const BASE = require('./jest.config.base');

module.exports = {
  projects: [
    {
      ...BASE,
      displayName: 'language-server',
      rootDir: '<rootDir>/packages/language-server'
    }
  ]
};
