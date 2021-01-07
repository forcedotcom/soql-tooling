import { DefaultErrorStrategy } from 'antlr4ts/DefaultErrorStrategy';
//import { DefaultErrorStrategy } from './DefaultErrorStrategy';
import { Parser } from 'antlr4ts/Parser';
import { Token } from 'antlr4ts/Token';

import { IntervalSet } from 'antlr4ts/misc/IntervalSet';
import { SoqlParser } from '@salesforce/soql-parser/lib/generated/SoqlParser';
import { SoqlLexer } from '@salesforce/soql-parser/lib/generated/SoqlLexer';

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

  /**
   * More aggressive recovering from the parsing of a broken "soqlField":
   * keep consuming tokens until we find a COMMA or FROM (iff they are
   * part of the tokens recovery set)
   *
   * This helps with the extraction of the FROM expressions when the SELECT
   * expressions do not parse correctly.
   *
   * @example
   * ```soql
   *    SELECT AVG(|) FROM Account
   * ```
   * Here 'AVG()' fails to parse, but the default error strategy doesn't discard 'AVG'
   * because it matches the IDENTIFIER token of a following rule (soqlAlias rule). This
   * completes the soqlSelectClause and leaves '()' for the soqlFromClause rule, and
   * which fails to extract the values off the FROM expressions.
   *
   */
  protected getErrorRecoverySet(recognizer: Parser): IntervalSet {
    const defaultRecoverySet = super.getErrorRecoverySet(recognizer);

    if (recognizer.ruleContext.ruleIndex === SoqlParser.RULE_soqlField) {
      const soqlFieldFollowSet = new IntervalSet();
      soqlFieldFollowSet.add(SoqlLexer.COMMA);
      soqlFieldFollowSet.add(SoqlLexer.FROM);

      const intersection = defaultRecoverySet.and(soqlFieldFollowSet);
      if (intersection.size > 0) return intersection;
    }

    return defaultRecoverySet;
  }
}
