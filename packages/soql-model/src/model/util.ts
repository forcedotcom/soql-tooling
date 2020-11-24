/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Impl from './impl';
import { AndOr, Condition } from './model';

export namespace SoqlModelUtils {
  export function containsUnmodeledSyntax(model: object): boolean {
    if ('unmodeledSyntax' in model) {
      return true;
    }
    for (const property in model) {
      if (typeof (model as any)[property] === 'object') {
        const hasUnmodeledSyntax = containsUnmodeledSyntax(
          (model as any)[property]
        );
        if (hasUnmodeledSyntax) {
          return true;
        }
      }
    }
    return false;
  }

  export function containsError(model: object): boolean {
    if (
      'errors' in model &&
      Array.isArray((model as any).errors) &&
      (model as any).errors.length > 0
    ) {
      return true;
    }
    for (const property in model) {
      if (typeof (model as any)[property] === 'object') {
        const hasError = containsError((model as any)[property]);
        if (hasError) {
          return true;
        }
      }
    }
    return false;
  }

  export function simpleGroupToArray(
    condition: Condition
  ): { conditions: Condition[]; andOr?: AndOr } {
    if (!isSimpleGroup(condition)) {
      throw Error('not simple group');
    }
    condition = stripNesting(condition);
    let conditions: Condition[] = [];
    let andOr: AndOr | undefined = undefined;
    if (condition instanceof Impl.AndOrConditionImpl) {
      conditions = conditions.concat(
        simpleGroupToArray(condition.leftCondition).conditions
      );
      conditions = conditions.concat(
        simpleGroupToArray(condition.rightCondition).conditions
      );
      andOr = condition.andOr;
    } else {
      conditions.push(condition);
    }
    return { conditions, andOr };
  }

  export function arrayToSimpleGroup(
    conditions: Condition[],
    andOr?: AndOr
  ): Condition {
    if (conditions.length > 1 && andOr === undefined) {
      throw Error('no operator supplied for conditions');
    }
    if (conditions.length === 0) {
      throw Error('no conditions');
    }

    if (conditions.length === 1) {
      return conditions[0];
    } else {
      const [left, ...rest] = conditions;
      return new Impl.AndOrConditionImpl(
        left as Condition,
        andOr as AndOr,
        arrayToSimpleGroup(rest, andOr)
      );
    }
  }

  export function isSimpleGroup(condition: Condition, andOr?: AndOr): boolean {
    // a simple group is a condition that can be expressed as an ANY or ALL group of conditions
    // ANY: simple conditions all joined by OR
    // ALL: simple conditions all joined by AND
    condition = stripNesting(condition);
    if (condition instanceof Impl.AndOrConditionImpl) {
      if (!andOr) {
        andOr = condition.andOr;
      }
      return (
        condition.andOr === andOr &&
        isSimpleGroup(condition.leftCondition, andOr) &&
        isSimpleGroup(condition.rightCondition, andOr)
      );
    }
    return isSimpleCondition(condition);
  }

  export function isSimpleCondition(condition: Condition): boolean {
    condition = stripNesting(condition);
    return (
      condition instanceof Impl.FieldCompareConditionImpl ||
      condition instanceof Impl.LikeConditionImpl ||
      condition instanceof Impl.IncludesConditionImpl ||
      condition instanceof Impl.InListConditionImpl ||
      condition instanceof Impl.UnmodeledSyntaxImpl
    );
  }

  export function getKeyByValue(
    object: { [key: string]: string },
    value: string
  ): string | undefined {
    return Object.keys(object).find((key: string) => object[key] === value);
  }

  function stripNesting(condition: Condition): Condition {
    while (condition instanceof Impl.NestedConditionImpl) {
      condition = (condition as Impl.NestedConditionImpl).condition;
    }
    return condition;
  }
}
