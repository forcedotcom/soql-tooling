const BASE = require("./jest.config.base");

module.exports = {
  projects: [
    {
      ...BASE,
      displayName: "language-server",
      rootDir: "<rootDir>/packages/language-server",
    },
    {
      ...BASE,
      displayName: "soql-builder-ui",
      rootDir: "<rootDir>/packages/soql-builder-ui",
    },
  ],
};
