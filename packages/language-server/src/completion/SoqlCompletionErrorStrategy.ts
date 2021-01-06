import { DefaultErrorStrategy } from 'antlr4ts/DefaultErrorStrategy';
import { Parser } from 'antlr4ts/Parser';
import { Token } from 'antlr4ts/Token';

export class SoqlCompletionErrorStrategy extends DefaultErrorStrategy {
  /**
   * The default error handling strategy is "too smart" for our code-completion purposes.
   * We generally do NOT want the parser to remove tokens for recovery.
   *
   * @example
   * ```soql
   *    SELECT id, | FROM Foo
   * ```
   * Here the default error strategy is drops `FROM` and makes `Foo` a field
   * of SELECTs' list. So we don't recognize `Foo` as the SObject we want to
   * query for.
   *
   * We might implement more SOQL-completion-specific logic in the future.
   */
  protected singleTokenDeletion(recognizer: Parser): Token | undefined {
    return undefined;
  }
}
