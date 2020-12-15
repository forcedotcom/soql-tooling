/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, createElement, LightningElement } from 'lwc';
import Where from 'querybuilder/where';
import { AndOr } from '../services/model';

class WhereExpressionManager {
  andOr;
  modelTemplate;

  constructor() {
    this.andOr = undefined;
    this.modelTemplate = {
      conditions: [],
      andOr: this.andOr
    };
  }

  public condition1 = {
    field: 'Name',
    operator: 'LT',
    criteria: { type: 'STRING', value: "'pwt'" },
    index: 0
  };

  public condition2 = {
    field: 'Id',
    operator: 'GT',
    criteria: { type: 'NUMBER', value: '123456' },
    index: 1
  };

  public incompleteCondition = {
    field: undefined,
    operator: undefined,
    criteria: { type: 'NUMBER', value: '123456' },
    index: 2
  };

  setAndOr(value: string) {
    this.andOr = value;
  }

  getEmptyModel() {
    return this.modelTemplate;
  }

  getModelWithOneCondition() {
    return {
      conditions: [this.condition1],
      andOr: this.andOr
    };
  }

  getModelWithTwoConditions() {
    return {
      conditions: [this.condition1, this.condition2],
      andOr: this.andOr
    };
  }

  getModelWithIncompleteConditions() {
    return {
      conditions: [this.condition1, this.condition2, this.incompleteCondition],
      andOr: this.andOr
    };
  }
}

class TestWhere extends Where {
  @api get testLastModifierGroupIsComplete() {
    return super.lastModifierGroupIsComplete;
  }
  @api get testAndOr() {
    return super._andOr;
  }
}

describe('Where', () => {
  let whereCmp: LightningElement;
  let modelManager: WhereExpressionManager;

  beforeEach(() => {
    whereCmp = createElement('querybuilder-where', {
      is: TestWhere
    });
    whereCmp.whereFields = ['foo', 'bar'];
    modelManager = new WhereExpressionManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe('Modifier Groups should', () => {
    it('render one EMPTY group if UI model has no conditions', async () => {
      whereCmp.whereExpr = modelManager.getEmptyModel();
      document.body.appendChild(whereCmp);

      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );
      // should always be one group w/ empty model
      expect(modfierGroups.length).toBe(1);

      const conditionStore = whereCmp.whereExpr.conditions;
      expect(conditionStore.length).toBe(1);
      expect(conditionStore[0].field).toBeUndefined();
      expect(conditionStore[0].operator).toBeUndefined();
      expect(conditionStore[0].index).toBe(0);
    });

    it('render ONE group based on UI model', async () => {
      whereCmp.whereExpr = modelManager.getModelWithOneCondition();
      document.body.appendChild(whereCmp);

      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );

      expect(modfierGroups.length).toBe(1);

      const conditionStore = whereCmp.whereExpr.conditions;
      expect(conditionStore.length).toBe(1);
      expect(conditionStore[0].field).toBe(modelManager.condition1.field);
      expect(conditionStore[0].operator).toBe(modelManager.condition1.operator);
      expect(conditionStore[0].index).toBe(modelManager.condition1.index);
    });

    it('render MANY groups based on UI model', async () => {
      whereCmp.whereExpr = modelManager.getModelWithTwoConditions();
      document.body.appendChild(whereCmp);

      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );

      expect(modfierGroups.length).toBe(2);

      const conditionStore = whereCmp.whereExpr.conditions;
      expect(conditionStore.length).toBe(2);
      expect(conditionStore[0].field).toBe(modelManager.condition1.field);
      expect(conditionStore[0].operator).toBe(modelManager.condition1.operator);
      expect(conditionStore[0].index).toBe(modelManager.condition1.index);
      expect(conditionStore[1].field).toBe(modelManager.condition2.field);
      expect(conditionStore[1].operator).toBe(modelManager.condition2.operator);
      expect(conditionStore[1].index).toBe(modelManager.condition2.index);
    });

    it('know when the last modifer is complete', async () => {
      whereCmp.whereExpr = modelManager.getEmptyModel();
      document.body.appendChild(whereCmp);
      expect(whereCmp.testLastModifierGroupIsComplete).toBe(false);

      whereCmp.whereExpr = modelManager.getModelWithTwoConditions();
      return Promise.resolve().then(() => {
        expect(whereCmp.testLastModifierGroupIsComplete).toBe(true);
      });
    });
  });

  describe('AND | OR should', () => {
    it('default to AND', () => {
      document.body.appendChild(whereCmp);
      expect(whereCmp.testAndOr).toBe(AndOr.AND);

      const andButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=AND]'
      );
      const orButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=OR]'
      );
      expect(andButton.classList).toContain('header__btn--selected');
      expect(orButton.classList).not.toContain('header__btn--selected');
    });

    it('be selected based on UI model', () => {
      modelManager.setAndOr(AndOr.OR);
      whereCmp.whereExpr = modelManager.getModelWithOneCondition();
      document.body.appendChild(whereCmp);
      expect(whereCmp.testAndOr).toBe(AndOr.OR);

      const andButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=AND]'
      );
      const orButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=OR]'
      );
      expect(andButton.classList).not.toContain('header__btn--selected');
      expect(orButton.classList).toContain('header__btn--selected');
    });

    it('only emit event if more than one complete condition', async () => {
      whereCmp.whereExpr = modelManager.getModelWithOneCondition();
      document.body.appendChild(whereCmp);

      const handler = jest.fn();
      const orButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=OR]'
      );
      const andButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=AND]'
      );

      whereCmp.addEventListener('andorselection', handler);
      orButton.click();
      expect(handler).not.toHaveBeenCalled();

      whereCmp.whereExpr = modelManager.getModelWithTwoConditions();
      return Promise.resolve().then(() => {
        andButton.click();
        expect(handler).toHaveBeenCalled();
      });
    });

    it('not emit event if last group is incomplete', () => {
      whereCmp.whereExpr = modelManager.getModelWithIncompleteConditions();
      document.body.appendChild(whereCmp);
      const handler = jest.fn();
      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );
      const orButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        'button[value=OR]'
      );
      whereCmp.addEventListener('andorselection', handler);

      expect(modfierGroups.length).toBe(3);
      expect(whereCmp.testLastModifierGroupIsComplete).toBe(false);
      expect(whereCmp.testAndOr).toBe(AndOr.AND);
      orButton.click();

      expect(handler).not.toHaveBeenCalled();
    });

    it('add state of AndOr to modifier selection event', () => {
      modelManager.setAndOr(AndOr.OR);
      whereCmp.whereExpr = modelManager.getModelWithTwoConditions();
      document.body.appendChild(whereCmp);
      const modGroupHandler = jest.fn();
      whereCmp.addEventListener('modifierselectionwithandor', modGroupHandler);
      const firstModfierGroup = whereCmp.shadowRoot.querySelector(
        'querybuilder-where-modifier-group'
      );
      // Event dispatched from child component does not contain AndOr
      firstModfierGroup.dispatchEvent(
        new CustomEvent('modifiergroupselection', {
          detail: modelManager.condition1
        })
      );
      // event dispatched from where should have payload from child + andOr state
      expect(modGroupHandler).toHaveBeenCalled();
      expect(modGroupHandler.mock.calls[0][0].detail.fieldCompareExpr).toEqual(
        modelManager.condition1
      );
      expect(modGroupHandler.mock.calls[0][0].detail.andOr).toEqual(
        whereCmp.testAndOr
      );
    });
  });

  describe('ADD Group should', () => {
    it('be disabled if last modifier is incomplete', async () => {
      whereCmp.whereExpr = modelManager.getModelWithIncompleteConditions();
      document.body.appendChild(whereCmp);

      const addButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        '[data-el-where-add-btn]'
      );
      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );

      expect(modfierGroups.length).toBe(3);
      expect(whereCmp.testLastModifierGroupIsComplete).toBe(false);

      return Promise.resolve().then(() => {
        expect(addButton.classList).toContain('btn--disabled');
      });
    });

    it('be enabled if all modifiers & groups have value', async () => {
      whereCmp.whereExpr = modelManager.getModelWithTwoConditions();
      document.body.appendChild(whereCmp);

      const addButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        '[data-el-where-add-btn]'
      );
      const modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );

      expect(modfierGroups.length).toBe(2);
      expect(whereCmp.testLastModifierGroupIsComplete).toBe(true);

      return Promise.resolve().then(() => {
        expect(addButton.classList).not.toContain('btn--disabled');
      });
    });

    it('should render an empty group when clicked', () => {
      whereCmp.whereExpr = modelManager.getModelWithOneCondition();
      document.body.appendChild(whereCmp);
      let conditionsStore = whereCmp.whereExpr.conditions;
      const addButton: HTMLButtonElement = whereCmp.shadowRoot.querySelector(
        '[data-el-where-add-btn]'
      );
      let modfierGroups = whereCmp.shadowRoot.querySelectorAll(
        'querybuilder-where-modifier-group'
      );
      expect(modfierGroups.length).toBe(1);
      expect(conditionsStore.length).toBe(1);
      expect(whereCmp.testLastModifierGroupIsComplete).toBe(true);
      addButton.click();

      return Promise.resolve().then(() => {
        conditionsStore = whereCmp.whereExpr.conditions;
        modfierGroups = whereCmp.shadowRoot.querySelectorAll(
          'querybuilder-where-modifier-group'
        );
        expect(conditionsStore.length).toBe(2);
        expect(modfierGroups.length).toBe(2);
        expect(conditionsStore[1].field).toBeUndefined();
        expect(conditionsStore[1].operator).toBeUndefined();
        expect(conditionsStore[1].criteria.type).toBeNull();
        expect(conditionsStore[1].criteria.value).toBeNull();
        expect(conditionsStore[1].index).toBe(1);
      });
    });
  });
});
