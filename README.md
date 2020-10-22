# SOQL Tooling

### Introduction

This repo contains the source for the SOQL Language Tooling features including:

    packages
    |-- language-server/        SOQL language server
    |-- soql-builder-ui/        SOQL Query Builder UI with [LWC](https://lwc.dev/)
    |-- soql-model/             SOQL internal model
    `-- soql-tmlanguage/        SOQL TextMate grammar (for syntax highlighting)

### Development

Run `npm install` from the top-level directory to pull all dependencies and auto-link local dependencies between packages (i.e: `soql-builder-ui` depends on `soql-model`).

These packages are used from VS Code extension `salesforcedx-vscode-soql` which lives in repo [salesforcedx-vscode](https://github.com/forcedotcom/salesforcedx-vscode).

During development, you can work with a local copy of the `salesforcedx-vscode` repo, and configure it to use your local packages in your `soql-tooling` repo. Example:

```
# Make global links available
cd ~/repos/soql-tooling
for P in packages/*; do cd $P; npm link; cd -; done

# Link to them from the VS Code SOQL extension package
cd ~/repos/salesforcedx-vscode/packages/salesforcedx-vscode-soql
npm install
npm link @salesforce/soql-builder-ui
npm link @salesforce/soql-tmlanguage
npm link @salesforce/soql-language-server
```

With that in place, you can make changes to your soql-tooling packages, compile them, and then relaunch the whole `salesforcedx-vscode` extension from VSCode to see the changes.

### Debug Jest Test

You can debug Jest test for an individual package by running the corresponding launch configuraiton in VS Codes _RUN_ panel.

### Publishing

Some packages depend on `@salesforce/soql-parser` which is included as a static dependency, since it is not yet published. Packages must be published with `@salesforce/soql-tooling` as a bundled dependency, since the static tarball is not available in the published packages. There are prepack and postpack scripts to convert the static dependency to a bundled dependency and back again, so when these packages are published it is important to pack the package as a tarball (`npm pack`) and publish the tarball (`npm publish [package-tarball].tgz`) rather than publishing the package directory.
