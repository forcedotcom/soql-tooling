/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import WhereModifierGroup from 'querybuilder/whereModifierGroup';
import { debounce } from 'debounce';

jest.mock('debounce');
// @ts-ignore
debounce.mockImplementation((callback) => {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  return callback;
});

describe('WhereModifierGroup should', () => {
  let modifierGroup;

  function getModifierElements() {
    const selectFieldEl: HTMLSelectElement = modifierGroup.shadowRoot.querySelector(
      '[data-el-where-field]'
    );
    const selectOperatorEl: HTMLSelectElement = modifierGroup.shadowRoot.querySelector(
      '[data-el-where-operator-input]'
    );
    const criteriaInputEl: HTMLInputElement = modifierGroup.shadowRoot.querySelector(
      '[data-el-where-criteria-input]'
    );

    return {
      selectFieldEl,
      selectOperatorEl,
      criteriaInputEl
    };
  }

  function setModifiersToHaveAValue(scope: string) {
    const { selectFieldEl, selectOperatorEl } = getModifierElements();

    switch (scope) {
      case 'all':
        selectFieldEl.value = 'foo';
        selectOperatorEl.value = 'EQ';
        modifierGroup.criteria = { value: 'test' };
        break;
      case 'some':
        selectFieldEl.value = 'foo';
        selectOperatorEl.value = undefined;
        modifierGroup.criteria = { value: null };
        break;
      case 'none':
        selectFieldEl.value = undefined;
        selectOperatorEl.value = undefined;
        modifierGroup.criteria = { value: null };
        break;
      default:
        console.log('Unkown Case to Set Values');
        break;
    }
  }

  beforeEach(() => {
    modifierGroup = createElement('querybuilder-where-modifier-group', {
      is: WhereModifierGroup
    });
    // set up cmp api properties here
    modifierGroup.allFields = ['foo', 'bar'];
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('know when all modifers have a value', () => {
    document.body.appendChild(modifierGroup);

    expect(modifierGroup.allModifiersHaveValue).toBeFalsy();

    setModifiersToHaveAValue('all');

    return Promise.resolve().then(() => {
      expect(modifierGroup.allModifiersHaveValue).toBeTruthy();
    });
  });

  it('emit event when all modfiers have value', () => {
    document.body.appendChild(modifierGroup);
    const handler = jest.fn();
    modifierGroup.addEventListener('modifiergroupselection', handler);

    setModifiersToHaveAValue('all');
    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.dispatchEvent(new Event('input'));

    expect(handler).toHaveBeenCalled();
  });

  it('not emit event when SOME modfiers have no value', () => {
    document.body.appendChild(modifierGroup);
    const handler = jest.fn();
    modifierGroup.addEventListener('modifiergroupselection', handler);

    setModifiersToHaveAValue('some');
    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.dispatchEvent(new Event('input'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('not emit event when ALL modfiers have no value', () => {
    document.body.appendChild(modifierGroup);
    const handler = jest.fn();
    modifierGroup.addEventListener('modifiergroupselection', handler);

    setModifiersToHaveAValue('none');
    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.dispatchEvent(new Event('input'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('emit event when modifier group is removed', () => {
    document.body.appendChild(modifierGroup);
    const handler = jest.fn();
    modifierGroup.addEventListener('where__condition_removed', handler);

    const closeButton = modifierGroup.shadowRoot.querySelector(
      '[data-el-where-delete]'
    );

    closeButton.click();
    expect(handler).toHaveBeenCalled();
  });

  it('display the correct operator', () => {
    modifierGroup.selectedOperator = 'LT';
    document.body.appendChild(modifierGroup);

    const { selectOperatorEl } = getModifierElements();

    expect(selectOperatorEl.value).toBe('LT');
    const firstOptionElement = selectOperatorEl
      .children[0] as HTMLOptionElement;

    expect(firstOptionElement.selected).toBeTruthy();
    expect(selectOperatorEl.children[0].innerHTML).toContain('&lt;');
  });

  it('alert the user when loading', async () => {
    document.body.appendChild(modifierGroup);
    expect(modifierGroup.isLoading).toEqual(false);

    let defaultOption = modifierGroup.shadowRoot.querySelector(
      '[data-el-default-option]'
    );
    expect(defaultOption.innerHTML).toContain('Select');

    modifierGroup.isLoading = true;
    return Promise.resolve().then(() => {
      expect(defaultOption.innerHTML.toLowerCase()).toContain('loading');
    });
  });

  it('display the correct criteria value for strings', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'EQ';
    modifierGroup.criteria = { type: 'STRING', value: "'HELLO'" };
    document.body.appendChild(modifierGroup);

    const { criteriaInputEl } = getModifierElements();
    expect(criteriaInputEl.value).toEqual('HELLO');
  });

  it('display the correct criteria value for non-strings', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'EQ';
    modifierGroup.criteria = { type: 'BOOLEAN', value: 'TRUE' };
    document.body.appendChild(modifierGroup);

    const { criteriaInputEl } = getModifierElements();
    expect(criteriaInputEl.value).toEqual('TRUE');
  });

  it('normalize criteria input for strings', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'EQ';
    modifierGroup.criteria = { type: 'STRING', value: "'HELLO'" };
    modifierGroup.sobjectMetadata = {
      fields: [{ name: 'foo', type: 'string' }]
    };
    let resultingCriteria;
    const handler = (e) => {
      resultingCriteria = e.detail.criteria;
    };
    modifierGroup.addEventListener('modifiergroupselection', handler);

    document.body.appendChild(modifierGroup);

    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.value = 'WORLD';
    criteriaInputEl.dispatchEvent(new Event('input'));

    expect(resultingCriteria).toEqual({ type: 'STRING', value: "'WORLD'" });
  });

  it('normalize criteria input for non-strings', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'EQ';
    modifierGroup.criteria = { type: 'BOOLEAN', value: 'TRUE' };
    modifierGroup.sobjectMetadata = {
      fields: [{ name: 'foo', type: 'boolean' }]
    };
    let resultingCriteria;
    const handler = (e) => {
      resultingCriteria = e.detail.criteria;
    };
    modifierGroup.addEventListener('modifiergroupselection', handler);
    document.body.appendChild(modifierGroup);

    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.value = 'FALSE';
    criteriaInputEl.dispatchEvent(new Event('input'));

    expect(resultingCriteria).toEqual({ type: 'BOOLEAN', value: 'FALSE' });
  });

  it('set error class on invalid operator input', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'LT'; // not a valid boolean operator
    modifierGroup.criteria = { type: 'BOOLEAN', value: 'TRUE' };
    modifierGroup.sobjectMetadata = {
      fields: [{ name: 'foo', type: 'boolean' }]
    };
    const handler = jest.fn();
    modifierGroup.addEventListener('modifiergroupselection', handler);
    document.body.appendChild(modifierGroup);
    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.value = 'true';
    criteriaInputEl.dispatchEvent(new Event('input'));
    expect(handler).not.toHaveBeenCalled();
    return Promise.resolve().then(() => {
      const operatorContainerEl = modifierGroup.shadowRoot.querySelector(
        '[data-el-where-operator]'
      );
      expect(operatorContainerEl.className).toContain('error');
    });
  });

  it('set error class of invalid criteria input', async () => {
    modifierGroup.selectedField = 'foo';
    modifierGroup.selectedOperator = 'EQ';
    modifierGroup.criteria = { type: 'BOOLEAN', value: 'TRUE' };
    modifierGroup.sobjectMetadata = {
      fields: [{ name: 'foo', type: 'boolean' }]
    };
    const handler = jest.fn();
    modifierGroup.addEventListener('modifiergroupselection', handler);
    document.body.appendChild(modifierGroup);
    const { criteriaInputEl } = getModifierElements();
    criteriaInputEl.value = 'Hello'; // not a valid boolean criteria
    criteriaInputEl.dispatchEvent(new Event('input'));
    expect(handler).not.toHaveBeenCalled();
    return Promise.resolve().then(() => {
      const operatorContainerEl = modifierGroup.shadowRoot.querySelector(
        '[data-el-where-criteria]'
      );
      expect(operatorContainerEl.className).toContain('error');
    });
  });
});
