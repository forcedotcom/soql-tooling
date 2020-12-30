/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { createElement } from 'lwc';
import CustomSelect from 'querybuilder/customSelect';

describe('Custom Select', () => {
  const customSelect = createElement('querybuilder-custom-select', {
    is: CustomSelect
  });

  beforeEach(() => {
    customSelect.allOptions = ['Foo', 'Bar', 'Baz'];
    customSelect.selectedOptions = [];
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe('UI RENDERING', () => {
    it('should alert user when loading', async () => {
      document.body.appendChild(customSelect);
      expect(customSelect.isLoading).toEqual(false);
      let searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      expect(searchBar.getAttribute('placeholder').toLowerCase()).not.toContain(
        'loading'
      );

      customSelect.isLoading = true;
      return Promise.resolve().then(() => {
        searchBar = customSelect.shadowRoot.querySelector(
          'input[name=search-bar]'
        );
        expect(customSelect.isLoading).toEqual(true);
        expect(searchBar.getAttribute('placeholder').toLowerCase()).toContain(
          'loading'
        );
        customSelect.isLoading = false;
      });
    });

    it('should use placeholder api', () => {
      document.body.appendChild(customSelect);
      const exampleText = 'hold my beer';
      let searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      expect(searchBar.getAttribute('placeholder')).toBe('');

      customSelect.placeholderText = exampleText;
      return Promise.resolve().then(() => {
        expect(searchBar.getAttribute('placeholder')).toBe(exampleText);
      });
    });

    it('should NOT display the list of options by default', () => {
      document.body.appendChild(customSelect);
      const optionsList = customSelect.shadowRoot.querySelector(
        '.options__wrapper'
      );

      expect(optionsList.getAttribute('aria-hidden')).toBe('true');
    });

    it('should display the list of options when input is clicked', () => {
      document.body.appendChild(customSelect);
      const searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );

        expect(optionsList.getAttribute('aria-hidden')).toBe('false');
      });
    });

    it('should close the list of options with document click event', () => {
      let optionsList;
      document.body.appendChild(customSelect);
      const searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );

          expect(optionsList.getAttribute('aria-hidden')).toBe('false');

          document.dispatchEvent(new Event('click'));
        })
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );

          expect(optionsList.getAttribute('aria-hidden')).toBe('true');
        });
    });
  });

  describe('OPTIONS', () => {
    it('should only display options not already selected', () => {});

    it('should ignore character case of selected options', () => {});

    it('should fire a selection event when clicked', () => {});
  });

  describe('KEYBOARD EVENTS', () => {
    it('should allow navigation with DOWN ARROW', () => {});

    it('should allow navigation with UP ARROW', () => {});

    it('should allow option selection with ENTER', () => {});

    it('should close options list with ESCAPE', () => {});
  });
});
