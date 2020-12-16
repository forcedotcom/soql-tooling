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
      '[data-el-where-operator]'
    );
    const criteriaInputEl: HTMLInputElement = modifierGroup.shadowRoot.querySelector(
      '[data-el-where-criteria]'
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
});
