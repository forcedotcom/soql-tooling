## Introduction

This repository contains the language grammar for Salesforce's SOQL query language.

## Development

- Run `yarn` to install dependencies.
- Run `yarn build` to generate the final (.json) grammar file for VS Code.
- Run `yarn test` to run unit tests (based on https://github.com/PanAeon/vscode-tmgrammar-test)

This package is used from VS Code extension `salesforcedx-vscode-soql`. With that extension installed, you can see the grammar in action and debug/inspect it by opening a `.soql` file
(with the VS Code text editor) and then runnning command `Developer: Inspect Editor Tokens and Scopes`.

## Grammar file

    grammars/
    |-- soql.tmLanguage.yaml         ;; The source of the SOQL grammar
    `-- soql.tmLanguage.json         ;; Generated .json version of the grammar (git ignored)

VSCode only reads grammars in json format. `yarn build` generates the `.json` version of the SOQL grammar using `js-yaml`.

## Tests

Tests are executed with [vscode-tmgrammar-tests](https://github.com/PanAeon/vscode-tmgrammar-test).

    test/                   "Manually" created test case
    |-- simple_account.soql
    `-- snapshots/          "Snapshot-based" test cases
        |-- example-*.soql
        |-- example-*.soql.snap
        `-- ...

- `yarn test:source` validates "manually created" queries.
- `yarn test:snapshots` validates "snapshot-based" queries.
- `yarn test` validates both.

The difference between manual vs. snapshot tests is that the latter are auto-generated and can be updated with command `vscode-tmgrammar-snap -u`. They are useful to quickly see the output of applying the grammar and catch regressions.

The example-\* queries were taken from [Example SELECT clauses](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select_examples.htm).
