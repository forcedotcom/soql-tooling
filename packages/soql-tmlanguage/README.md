## Introduction

This repository contains the language grammar files for Salesforce's SOQL query language.

## Development

- Run `yarn` to install dependencies.
- Run `yarn build` to generate the .json format of the grammar.
- Run `yarn test` to run unit tests (based on https://github.com/PanAeon/vscode-tmgrammar-test)

This package is used from VS Code extension `salesforcedx-vscode-soql`. With that extension installed, you can see the grammar in action and debug/inspect it by opening a `.soql` file
(with the VS Code text editor) and then run command `Developer: Inspect Editor Tokens and Scopes`.

## Grammar source files

    grammars/
    |-- simple-soql.tmLanguage.yaml  ;; A simple grammar based on a generic SQL grammar. Only used for tinkering, learning and testing
    |-- apex.tmLanguage.yml          ;; The original full Apex grammar we used as a base for:
    `-- soql.tmLanguage.yaml         ;; The current SOQL grammar, apdapted from the full Apex grammar

The build script generates the `.json` version of the SOQL grammar.
