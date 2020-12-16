/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SoqlModelUtils } from './util';
import * as Impl from './impl';
import * as Soql from './model';

const field = new Impl.FieldRefImpl('field');
const literal = new Impl.LiteralImpl(Soql.LiteralType.String, "'Hello'");
const conditionFieldCompare = new Impl.FieldCompareConditionImpl(field, Soql.CompareOperator.EQ, literal);
const conditionLike = new Impl.LikeConditionImpl(field, literal);
const conditionInList = new Impl.InListConditionImpl(field, Soql.InOperator.In, [literal]);
const conditionIncludes = new Impl.IncludesConditionImpl(field, Soql.IncludesOperator.Includes, [literal]);
const conditionUnmodeled = new Impl.UnmodeledSyntaxImpl('A + B > 10');
const conditionAndOr = new Impl.AndOrConditionImpl(conditionFieldCompare, Soql.AndOr.And, conditionLike);
const conditionNested = new Impl.NestedConditionImpl(conditionFieldCompare);
const conditionNot = new Impl.NotConditionImpl(conditionFieldCompare);


describe('SoqlModelUtils should', () => {
  it('return true if SOQL query model contains unmodeled syntax', () => {
    const actual = SoqlModelUtils.containsUnmodeledSyntax(
      new Impl.QueryImpl(
        new Impl.SelectExprsImpl([
          new Impl.FieldSelectionImpl(
            new Impl.FieldRefImpl(
              'field1',
            ),
            new Impl.UnmodeledSyntaxImpl('alias1')
          )
        ]),
        new Impl.FromImpl('object1')
      )
    );
    expect(actual).toBeTruthy();
  });
  it('return false if SOQL query model does not contain unmodeled syntax', () => {
    const actual = SoqlModelUtils.containsUnmodeledSyntax(
      new Impl.QueryImpl(
        new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field1')]),
        new Impl.FromImpl('object1')
      )
    );
    expect(actual).toBeFalsy();
  });
  it('return true if SOQL query model contains error', () => {
    const model: Soql.Query = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([new Impl.FieldRefImpl('field1')]),
      new Impl.FromImpl('object1')
    );
    model.errors = [{ type: Soql.ErrorType.UNKNOWN, message: 'ERROR', lineNumber: 1, charInLine: 1 }];

    const actual = SoqlModelUtils.containsError(model);
    expect(actual).toBeTruthy();
  });
  it('return false if SOQL query model does not contain error', () => {
    const model: Soql.Query = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([new Impl.FieldSelectionImpl(new Impl.FieldRefImpl('field1'))]),
      new Impl.FromImpl('object1')
    );

    const actual = SoqlModelUtils.containsError(model);
    expect(actual).toBeFalsy();
  });
  it('return true from isSimpleCondition for simple conditions', () => {
    const simpleConditions: Soql.Condition[] = [
      conditionFieldCompare,
      conditionLike,
      conditionIncludes,
      conditionInList,
      conditionUnmodeled,
      conditionNested
    ];
    let actual = true;
    simpleConditions.forEach(condition => actual &&= SoqlModelUtils.isSimpleCondition(condition));
    expect(actual).toBeTruthy();
  })
  it('return false from isSimpleCondition for non-simple conditions', () => {
    const complexConditions: Soql.Condition[] = [
      conditionAndOr,
      conditionNot,
      new Impl.NestedConditionImpl(conditionAndOr)
    ];
    let actual = true;
    complexConditions.forEach(condition => actual &&= !SoqlModelUtils.isSimpleCondition(condition));
    expect(actual).toBeTruthy();
  })
  it('return true from isSimpleGroup for simple group of conditions', () => {
    const simpleGroups: Soql.Condition[] = [
      conditionFieldCompare,
      conditionAndOr,
      new Impl.AndOrConditionImpl(conditionFieldCompare, Soql.AndOr.And, conditionAndOr),
      new Impl.NestedConditionImpl(conditionAndOr)
    ];
    let actual = true;
    simpleGroups.forEach(condition => actual &&= SoqlModelUtils.isSimpleGroup(condition));
    expect(actual).toBeTruthy();
  });
  it('return false from isSimpleGroup for non-simple group of conditions', () => {
    const nonSimpleGroups: Soql.Condition[] = [
      // NOT
      conditionNot,
      // mixing AND and OR
      new Impl.AndOrConditionImpl(conditionFieldCompare, Soql.AndOr.Or, conditionAndOr),
      // combined simple groups
      new Impl.AndOrConditionImpl(
        new Impl.NestedConditionImpl(conditionAndOr),
        Soql.AndOr.Or,
        new Impl.NestedConditionImpl(conditionAndOr)
      )
    ];
    let actual = true;
    nonSimpleGroups.forEach(condition => actual &&= !SoqlModelUtils.isSimpleGroup(condition));
    expect(actual).toBeTruthy();
  });
  it('throws from simpleGroupToArray if condition not simple group', () => {
    const nonSimpleGroup = new Impl.AndOrConditionImpl(conditionFieldCompare, Soql.AndOr.Or, conditionAndOr);
    expect(() => SoqlModelUtils.simpleGroupToArray(nonSimpleGroup)).toThrow();
  });
  it('returns array and operator from simpleGroupToArray for simple group', () => {
    const simpleGroup = new Impl.AndOrConditionImpl(conditionFieldCompare, Soql.AndOr.And, conditionAndOr);
    const { conditions, andOr } = SoqlModelUtils.simpleGroupToArray(simpleGroup);
    expect(conditions.length).toEqual(3);
    expect(andOr).toEqual(Soql.AndOr.And);
  });
  it('throws from arrayToSimpleGroup if conditions array empty', () => {
    const conditions: Soql.Condition[] = [];
    expect(() => SoqlModelUtils.arrayToSimpleGroup(conditions)).toThrow();
  });
  it('throws from arrayToSimpleGroup if >1 condition and operator missing', () => {
    const conditions: Soql.Condition[] = [conditionFieldCompare, conditionLike];
    expect(() => SoqlModelUtils.arrayToSimpleGroup(conditions)).toThrow();
  });
  it('returns simple group condition from arrayToSimpleGroup', () => {
    const conditions = [conditionFieldCompare, conditionLike, conditionInList];
    const andOr = Soql.AndOr.Or;

    const expected = new Impl.AndOrConditionImpl(
      conditions[0],
      andOr,
      new Impl.AndOrConditionImpl(
        conditions[1],
        andOr,
        conditions[2]
      )
    );
    const actual = SoqlModelUtils.arrayToSimpleGroup(conditions, andOr);
    expect(actual).toEqual(expected);
  });
});
