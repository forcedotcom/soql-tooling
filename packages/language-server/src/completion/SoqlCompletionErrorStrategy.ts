import { DefaultErrorStrategy } from 'antlr4ts/DefaultErrorStrategy';
import { Parser } from 'antlr4ts/Parser';
import { Token } from 'antlr4ts/Token';

export class SoqlCompletionErrorStrategy extends DefaultErrorStrategy {
  protected singleTokenDeletion(recognizer: Parser): Token | undefined {
    return undefined;
  }
}
