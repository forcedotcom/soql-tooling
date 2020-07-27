// This config will be used for all packages
module.exports = {
    testEnvironment: 'node',
    transform: {
      '\\.(ts)$': 'ts-jest'
    },
    testMatch: ['**/*.+(spec|test).(ts|js)'],
    preset: 'ts-jest',
    testPathIgnorePatterns: ['/lib/', '/node_modules/']
  };
  