/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SelectAnalyzer, Selection } from './selectAnalyzer';

describe('SelectAnalyzer should', () => {
  const simpleA: Selection = {
    selectionQueryText: 'A',
    queryResultsPath: ['A'],
    columnName: 'A'
  };
  const simpleB: Selection = {
    selectionQueryText: 'B',
    queryResultsPath: ['B'],
    columnName: 'B'
  };
  const innerA: Selection = {
    selectionQueryText: 'A',
    queryResultsPath: ['Y', 'A'],
    columnName: 'Y.A'
  };
  const innerB: Selection = {
    selectionQueryText: 'B',
    queryResultsPath: ['Y', 'B'],
    columnName: 'Y.B'
  };
  const parentRelationshipCD: Selection = {
    selectionQueryText: 'C.D',
    queryResultsPath: ['C', 'D'],
    columnName: 'C.D'
  };
  const minE: Selection = {
    selectionQueryText: 'MIN(E)',
    queryResultsPath: ['expr0'],
    columnName: 'MIN(E)'
  };
  const maxE: Selection = {
    selectionQueryText: 'MAX(E)',
    queryResultsPath: ['expr1'],
    columnName: 'MAX(E)'
  };
  const alias: Selection = {
    selectionQueryText: 'MIN(E)',
    queryResultsPath: ['MIN'],
    columnName: 'MIN'
  };

  it('identify simple selections', () => {
    const expected = [simpleA, simpleB];
    const actual = new SelectAnalyzer('SELECT A, B FROM X').getSelections();
    expect(actual).toEqual(expected);
  });

  it('identify related selections', () => {
    const expected = [parentRelationshipCD];
    const actual = new SelectAnalyzer('SELECT C.D FROM X').getSelections();
    expect(actual).toEqual(expected);
  });

  it('identify inner query selections', () => {
    const expected = [simpleA, simpleB, innerA, innerB];
    const actual = new SelectAnalyzer('SELECT A, B, (SELECT A, B FROM Y) FROM X').getSelections();
    expect(actual).toEqual(expected);
  });

  it('identify aggregate function selections', () => {
    const expected = [simpleA, minE, maxE];
    const actual = new SelectAnalyzer('SELECT A, MIN(E), MAX(E) FROM X GROUP BY A').getSelections();
    expect(actual).toEqual(expected);
  });

  it('identify aliased selections', () => {
    const expected = [alias];
    const actual = new SelectAnalyzer('SELECT MIN(E) MIN FROM X').getSelections();
    expect(actual).toEqual(expected);
  });
});
