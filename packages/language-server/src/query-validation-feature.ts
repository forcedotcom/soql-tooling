import { StaticFeature, ClientCapabilities } from 'vscode-languageclient';

export default class QueryValidationFeature implements StaticFeature {
  static hasRunQueryValidation(capabilities: ClientCapabilities): boolean {
    const customCapabilities: ClientCapabilities & {
      soql?: { runQuery: boolean };
    } = capabilities!;
    return customCapabilities?.soql?.runQuery || false;
  }

  initialize(): void {}

  fillClientCapabilities(capabilities: ClientCapabilities): void {
    const customCapabilities: ClientCapabilities & {
      soql?: { runQuery: boolean };
    } = capabilities!;
    customCapabilities.soql = {
      ...(customCapabilities.soql || {}),
      runQuery: true,
    };
  }
}
