# SOQL Tooling

## Introduction

This repo contains the source for SOQL Language Tooling features including:

- `soql-builder-ui`: SOQL Query Builder UI with [LWC](https://lwc.dev/)
- `soql-model`: SOQL queries internal model
- `soql-common`: SOQL common utility library. Shared by Query Builder and [Language Server](https://github.com/forcedotcom/soql-language-server)
- `soql-data-view`: Web assests for displaying SOQL Results

These packages are used from VS Code extension `salesforcedx-vscode-soql` which lives in repo [salesforcedx-vscode](https://github.com/forcedotcom/salesforcedx-vscode).

## Development

If you are interested in contributing, please take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

- Run `yarn` from the top-level directory to pull all dependencies and auto-link the local inter-dependencies between packages (i.e: `soql-builder-ui` depends on `soql-model`, which depends on `soql-common`).
- `yarn build` to compile and build
- `yarn run lint` to run static checks with eslint
- `yarn run test` to run automated tests

During development, you can work with a local copy of the `salesforcedx-vscode` repo and configure it to use your local build of packages in your `soql-tooling` repo using yarn/npm links. Example:

```
# Make global links available
cd soql-tooling
for P in packages/*; do cd $P; yarn link; cd -; done

# Link to them from the VS Code SOQL extension package
cd salesforcedx-vscode/packages/salesforcedx-vscode-soql
npm install
npm link @salesforce/soql-builder-ui
```

With that in place, you can make changes to your soql-tooling packages, compile them, and then relaunch the whole `salesforcedx-vscode` extension from VSCode to see the changes.

### Debug Jest Test

You can debug Jest test for an individual package by running the corresponding launch configuraiton in VS Codes _RUN_ panel.
