import { DefaultErrorStrategy } from 'antlr4ts/DefaultErrorStrategy';
import { Parser } from 'antlr4ts/Parser';
import { Token } from 'antlr4ts/Token';

export class SoqlCompletionErrorStrategy extends DefaultErrorStrategy {
  protected singleTokenDeletion(recognizer: Parser): Token | undefined {
    // The default error handling strategy is "too smart" for our code-completion purposes.
    // We generally do NOT want the parser to remove tokens for recovery.
    //
    // Example:
    //    SELECT id, | FROM Foo
    //
    // Here the parser drops `FROM` and makes Foo a field on SELECTs' list
    // So we don't recognize Foo as the SObject we want to query for.
    //
    // We might implement more SOQL-specific logic in the future.
    return undefined;
  }
}
