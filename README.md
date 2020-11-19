# SOQL Tooling

### Introduction

This repo contains the source for the SOQL Language Tooling features including:

    packages
    |-- language-server/        SOQL language server
    |-- soql-builder-ui/        SOQL Query Builder UI with [LWC](https://lwc.dev/)
    |-- soql-data-view/         View SOQL query results
    `-- soql-model/             SOQL internal model

### Development

Run `yarn` from the top-level directory to pull all dependencies and auto-link local dependencies between packages (i.e: `soql-builder-ui` depends on `soql-model`).

These packages are used from VS Code extension `salesforcedx-vscode-soql` which lives in repo [salesforcedx-vscode](https://github.com/forcedotcom/salesforcedx-vscode).

During development, you can work with a local copy of the `salesforcedx-vscode` repo, and configure it to use your local packages in your `soql-tooling` repo. Example:

```
# Make global links available
cd ~/repos/soql-tooling
for P in packages/*; do cd $P; yarn link; cd -; done

# Link to them from the VS Code SOQL extension package
cd ~/repos/salesforcedx-vscode/packages/salesforcedx-vscode-soql
npm install
npm link @salesforce/soql-builder-ui
npm link @salesforce/soql-language-server
```

With that in place, you can make changes to your soql-tooling packages, compile them, and then relaunch the whole `salesforcedx-vscode` extension from VSCode to see the changes.

### Debug Jest Test

You can debug Jest test for an individual package by running the corresponding launch configuraiton in VS Codes _RUN_ panel.

### Publishing

Some packages depend on `@salesforce/soql-parser` which is included as a static dependency, since it is not yet published. Packages must be published with `@salesforce/soql-tooling` as a bundled dependency, since the static tarball is not available in the published packages. There are prepack and postpack scripts as well as prepublish and postpublish scripts to convert the static dependency to a bundled dependency and back again, so when these packages are published they correctly refer to the soql-tooling dependency as a bundled dependency, but can find the static dependency again at development install-time.

#### CI Support for Publishing

To publish each of the modules, push a specially named tag that will trigger the correct workflow on CI.

Steps:

1. use [npm version command](https://docs.npmjs.com/cli/v6/commands/npm-version).
2. Push the commit to CI and verify the build.
3. Push a tag for the version you will publish.
   a. Tag should be formatted as the package name with -vX.X.X following semver
   b. examples:
   i. language-server-v1.2.3,
   i. soql-model-v4.5.6
   i. see config.yml for more information

_Gotcha's - because soql-builder-ui depends on soql model, and it is referenced as a dependency, soql-model should be published before soul-builder-ui._
