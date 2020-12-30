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
    jest.clearAllMocks();
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

    it('should NOT display the options wrapper by default', () => {
      document.body.appendChild(customSelect);
      const optionsList = customSelect.shadowRoot.querySelector(
        '.options__wrapper'
      );

      expect(optionsList.getAttribute('aria-hidden')).toBe('true');
    });

    it('should display the options wrapper when input is clicked', () => {
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

    it('should reset the search bar when X is clicked', () => {
      let optionsList;
      let clearSearchBtn;
      document.body.appendChild(customSelect);
      const searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      clearSearchBtn = customSelect.shadowRoot.querySelector(
        '.select__clear-search'
      );
      expect(searchBar.value).toBe('');
      expect(clearSearchBtn).toBeNull();

      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          expect(optionsList.getAttribute('aria-hidden')).toBe('false');
          searchBar.value = 'Foo';
          searchBar.dispatchEvent(new Event('input'));
        })
        .then(() => {
          clearSearchBtn = customSelect.shadowRoot.querySelector(
            '.select__clear-search'
          );
          expect(clearSearchBtn).not.toBeNull();
          expect(searchBar.value).toBe('Foo');

          clearSearchBtn.click();
        })
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          clearSearchBtn = customSelect.shadowRoot.querySelector(
            '.select__clear-search'
          );
          expect(optionsList.getAttribute('aria-hidden')).toBe('true');
          expect(searchBar.value).toBe('');
          expect(clearSearchBtn).toBeNull();
        });
    });
  });

  describe('OPTIONS', () => {
    let searchBar;

    beforeEach(() => {
      document.body.appendChild(customSelect);
      searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      // clear search bar value
      searchBar.value = '';
      searchBar.dispatchEvent(new Event('input'));
    });

    afterEach(() => {
      // close the options list to reset
      document.dispatchEvent(new Event('click'));
    });

    it('should render a list of options', () => {
      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );

        expect(optionsList.children.length).toBe(
          customSelect.allOptions.length
        );

        for (let option of customSelect.allOptions) {
          expect(optionsList.innerHTML).toContain(option);
        }
      });
    });

    it('should only display options not already selected', () => {
      customSelect.selectedOptions = ['Foo'];

      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );

        expect(optionsList.children.length).toBe(
          customSelect.allOptions.length - customSelect.selectedOptions.length
        );
        expect(optionsList.innerHTML).not.toContain('Foo');
      });
    });

    it('should ignore character case of selected options', () => {
      customSelect.selectedOptions = ['foo', 'bar'];

      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );

        expect(optionsList.children.length).toBe(
          customSelect.allOptions.length - customSelect.selectedOptions.length
        );
        expect(optionsList.innerHTML).not.toContain('Foo');
        expect(optionsList.innerHTML).not.toContain('Bar');
      });
    });

    it('should show options that match a user search', () => {
      let optionsList;

      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );

          expect(optionsList.getAttribute('aria-hidden')).toBe('false');
          expect(optionsList.children.length).toBe(
            customSelect.allOptions.length
          );
          searchBar.value = 'foo';
          searchBar.dispatchEvent(new Event('input'));
        })
        .then(() => {
          expect(optionsList.children.length).toBe(1);
          const optionValue = optionsList.firstChild.getAttribute(
            'data-option-value'
          );
          expect(optionValue).toBe('Foo');
        });
    });

    it('should let the user know where there are no search results', () => {
      let optionsList;

      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          expect(optionsList.getAttribute('aria-hidden')).toBe('false');
          expect(optionsList.children.length).toBe(
            customSelect.allOptions.length
          );
          searchBar.value = 'no match';
          searchBar.dispatchEvent(new Event('input'));
        })
        .then(() => {
          expect(optionsList.children.length).toBe(1);
          expect(optionsList.firstChild.classList).toContain(
            'option--placeholder'
          );
          expect(optionsList.firstChild.innerHTML).toContain('No results');
        });
    });

    it('should fire a selection event when clicked', () => {
      const handler = jest.fn();
      customSelect.addEventListener('option__selection', handler);

      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );
        const firstOption = optionsList.firstChild;
        const optionValue = firstOption.getAttribute('data-option-value');
        firstOption.click();

        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.optionValue).toEqual(
          optionValue
        );
      });
    });
  });

  describe('KEYBOARD EVENTS', () => {
    let mockScrollIntoView;
    let searchBar;

    beforeEach(() => {
      mockScrollIntoView = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
      document.body.appendChild(customSelect);
      searchBar = customSelect.shadowRoot.querySelector(
        'input[name=search-bar]'
      );
      // clear search bar value
      searchBar.value = '';
      searchBar.dispatchEvent(new Event('input'));
    });

    afterEach(() => {
      // close the options list to reset
      document.dispatchEvent(new Event('click'));
    });

    it('should NOT have any highlight options when opened', () => {
      searchBar.click();
      return Promise.resolve().then(() => {
        const optionsList = customSelect.shadowRoot.querySelector(
          '.options__wrapper'
        );

        for (let option of optionsList.children) {
          expect(option.classList).not.toContain('option--highlight');
        }
      });
    });

    it('should allow navigation with DOWN ARROW', () => {
      let firstOption;
      let optionsList;
      // open the list of options
      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          firstOption = optionsList.firstChild;
          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown' })
          );
        })
        .then(() => {
          expect(firstOption.classList).toContain('option--highlight');
          expect(mockScrollIntoView).toHaveBeenCalled();

          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown' })
          );
        })
        .then(() => {
          // only the second option should should be highlighted
          expect(firstOption.classList).not.toContain('option--highlight');
          expect(optionsList.children[1].classList).toContain(
            'option--highlight'
          );
        });
    });

    it('should allow navigation with UP ARROW', () => {
      let lastOption;
      let optionsList;
      // open the list of options
      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          lastOption = optionsList.lastChild;
          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowUp' })
          );
        })
        .then(() => {
          expect(lastOption.classList).toContain('option--highlight');
          expect(mockScrollIntoView).toHaveBeenCalled();

          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowUp' })
          );
        })
        .then(() => {
          // only the second to last option should should be highlighted
          expect(lastOption.classList).not.toContain('option--highlight');
          const secondToLastIndex = optionsList.children.length - 2;
          expect(optionsList.children[secondToLastIndex].classList).toContain(
            'option--highlight'
          );
        });
    });

    it('should allow option selection with ENTER', () => {
      let firstOption;
      let optionsList;
      const handler = jest.fn();
      customSelect.addEventListener('option__selection', handler);
      // open the list of options
      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          firstOption = optionsList.firstChild;
          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowDown' })
          );
        })
        .then(() => {
          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter' })
          );
          const optionValue = firstOption.getAttribute('data-option-value');
          firstOption.click();

          expect(handler).toHaveBeenCalled();
          expect(handler.mock.calls[0][0].detail.optionValue).toEqual(
            optionValue
          );
        });
    });

    it('should close options list with ESCAPE', () => {
      let optionsList;
      searchBar.click();
      return Promise.resolve()
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          expect(optionsList.getAttribute('aria-hidden')).toBe('false');
          searchBar.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape' })
          );
        })
        .then(() => {
          optionsList = customSelect.shadowRoot.querySelector(
            '.options__wrapper'
          );
          expect(optionsList.getAttribute('aria-hidden')).toBe('true');
        });
    });
  });
});
