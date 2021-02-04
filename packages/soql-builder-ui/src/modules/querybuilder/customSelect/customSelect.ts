import { api, track, LightningElement } from 'lwc';

/** CUSTOM SELECT API
 *  @attr multiple: string - Toggle single-select or multi-select behavior.
 *                  NOTE --> Will be interpreted as true if there is any string value passed in.
 *  @attr is-loading: boolean - Will display 'Loading...' when true.
 *  @attr all-options: string[] - This the list of all possible options
 *                                the user can select from.
 *  @attr selected-options: string[] - If present in single-select, the selectedOption
 *                                     will be displayed as the value of the input.
 *                                     The list of options rendered will be all-options - selected-options
 *  @attr placeholder-text: string - This is the value to be displayed as a placeholder for the input.
 *  @property value: string[] - Will return the currently selected value(s).
 *  @event option__selection - This is emitted everytime a valid option is selected.
 *                             detail { value: optionValue }
 * **/
interface CustomSelectEvent extends CustomEvent {
  detail: {
    target: HTMLInputElement;
  };
}

export default class CustomSelect extends LightningElement {
  @api multiple = false;
  @api isLoading = false;
  @api allOptions: string[];
  @track _renderedOptions: string[] = [];
  availableOptions: string[] = [];
  searchTerm = '';
  originalUserInput = '';
  dropdownArrow: HTMLElement;
  selectInputEl: HTMLInputElement;
  optionsWrapper: HTMLElement;
  optionList: HTMLCollection;
  optionListIsHidden = true;
  selectInputIsFocused = false;
  activeOptionIndex = -1;
  numberOfSearchResults;
  customSelectEventName = 'customselect__optionsopened';
  _placeholderText = '';
  _selectedOptions: string[] = [];
  _value: string[] = [];

  @api
  get selectedOptions() {
    return this._selectedOptions;
  }

  set selectedOptions(selectedOptions: string[]) {
    this._selectedOptions = selectedOptions || [];
    if (selectedOptions) {
      this._value = selectedOptions;
    }
  }

  @api
  get value(): string[] {
    return this._value;
  }

  @api
  get placeholderText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : this._placeholderText;
  }

  set placeholderText(text: string) {
    this._placeholderText = text;
  }
  /*
  1. If the user is typing, display the searchTerm
  2. If singleSelect
    - display the selected value (default)
    - if there is no searchTerm
    & the input is in focus
    & the input is empty
    display the placeholder
  */
  get displayValue(): string {
    if (this.hasSearchTerm) {
      return this.searchTerm;
    }

    if (this.isSingleSelect && this.selectInputEl) {
      if (!this.selectInputIsFocused || this.selectInputEl.value.length) {
        return this._value[0] || '';
      }
    }

    return '';
  }

  get hasSearchTerm() {
    return !!this.searchTerm;
  }

  get noResultsFound() {
    return this.hasSearchTerm && this.numberOfSearchResults === 0;
  }

  get dropDownArrowClassList() {
    let classList = 'select__dropdown-arrow';
    classList += this.optionListIsHidden ? '' : ' select__dropdown-arrow--up';
    return classList;
  }

  get isSingleSelect() {
    return !this.multiple;
  }

  get isMultipleSelect() {
    return this.multiple;
  }

  /* ======= LIFECYCLE HOOKS ======= */

  // close the options menu when user clicks outside component
  connectedCallback() {
    document.addEventListener(
      this.customSelectEventName,
      this.handleCloseOptions
    );
    document.addEventListener('click', this.handleCloseOptions);
  }

  // prevent a memory leak
  disconnectedCallback() {
    document.removeEventListener(
      this.customSelectEventName,
      this.handleCloseOptions
    );
    document.addEventListener('click', this.handleCloseOptions);
  }

  renderedCallback() {
    this.optionsWrapper =
      this.optionsWrapper || this.template.querySelector('.options__wrapper');
    this.optionList = this.optionsWrapper.children;
    this.selectInputEl =
      this.selectInputEl || this.template.querySelector('.select__input');
    this.dropdownArrow =
      this.dropdownArrow ||
      this.template.querySelector('.select__dropdown-arrow');
  }

  /* ======= UTILITIES ======= */

  calculateAvailableOptions() {
    this.availableOptions = this.allOptions.filter(
      (baseOption) =>
        !this.selectedOptions.some(
          (selectedOption) =>
            selectedOption.toLowerCase() === baseOption.toLowerCase()
        )
    );
  }

  filterOptionsBySearchTerm() {
    if (this.searchTerm) {
      const filteredOptions = this.availableOptions.filter((option) => {
        return option.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
      this.numberOfSearchResults = filteredOptions.length;
      this._renderedOptions = filteredOptions;
    } else {
      this._renderedOptions = this.availableOptions;
    }
  }

  getCurrentOptionValue(): string {
    return this.optionList[this.activeOptionIndex]
      ? this.optionList[this.activeOptionIndex].getAttribute(
          'data-option-value'
        )
      : '';
  }
  /*
  The component will fire a selection event
  - if the selection is a valid option
  - it will be up to the parent to handle/ignore
  - the state of _value will be updated either way
  & can be queried independantly of the model.
 */
  addSelectedOption(optionName: string = this.searchTerm) {
    const validOptionMatch: string[] = this.availableOptions.filter(
      (option) => {
        return option.toLowerCase() === optionName.toLowerCase();
      }
    );

    if (validOptionMatch.length) {
      const optionValue = validOptionMatch[0];
      const optionSelectionEvent = new CustomEvent('option__selection', {
        detail: {
          value: optionValue,
        },
      });

      if (this.isSingleSelect) {
        this._value = [optionValue];
      } else {
        this._value = [...this._value, optionValue];
      }

      this.dispatchEvent(optionSelectionEvent);
      this.resetSearchBar();
    }
  }

  hasOptionsToNavigate(): boolean {
    return (
      this.optionListIsHidden === false &&
      this.optionList.length > 0 &&
      this.noResultsFound === false
    );
  }

  clearActiveHighlight() {
    if (this.optionList[this.activeOptionIndex]) {
      this.optionList[this.activeOptionIndex].classList.remove(
        'option--highlight'
      );
    }
  }

  addOptionHighlight(position: number) {
    if (this.optionList[position]) {
      this.optionList[position].classList.add('option--highlight');
      this.optionList[position].scrollIntoView({
        block: 'end',
        inline: 'nearest',
      });
    }
  }

  resetSearchBar() {
    this.clearActiveHighlight();
    this.handleCloseOptions();
    this.searchTerm = '';
    this.originalUserInput = '';
    this.activeOptionIndex = -1;
    this.numberOfSearchResults = undefined;
  }

  openOptionsMenu() {
    if (this.optionListIsHidden) {
      this.calculateAvailableOptions();
      this.optionsWrapper.classList.add('options--open');
      this.optionListIsHidden = false;
    }
  }

  handleInputFocus() {
    this.selectInputIsFocused = !this.selectInputIsFocused;

    if (this.selectInputEl) {
      this.selectInputEl.classList.toggle('select__input-placeholder--fadeout');
    }
  }

  /* ======= EVENT HANDLERS ======= */

  // this is used for the dropdown Arrow button
  toggleOpenOptions(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.optionListIsHidden) {
      this.handleOpenOptions(e);
    } else {
      this.handleCloseOptions(e);
    }
  }
  /*
  This event is used to close any other
  options menu that are open except the target
  of the event. Custom event is needed due to
  “event retargeting.” by LWC.
  */
  sendOptionsOpenEvent(e: Event) {
    const optionsOpenedEvent = new CustomEvent(this.customSelectEventName, {
      detail: { target: e.target },
      bubbles: true,
      composed: true,
    }) as CustomSelectEvent;

    this.dispatchEvent(optionsOpenedEvent);
  }

  // called only when user clicks on search bar input
  handleOpenOptions(e) {
    e.preventDefault();
    e.stopPropagation();
    // only highlight current value if user clicks on input
    if (this.isSingleSelect && e.target === this.selectInputEl) {
      this.selectInputEl.select();
    }

    this.calculateAvailableOptions();
    if (this.hasSearchTerm) {
      this.filterOptionsBySearchTerm();
    } else {
      this._renderedOptions = this.availableOptions;
    }
    this.sendOptionsOpenEvent(e);
    this.openOptionsMenu();
    this.optionListIsHidden = false;
  }

  /**
   * This syntax allows the function to retain context of this
   * while also usable with addEventListener and removeEventListener
   */
  handleCloseOptions = (e?: CustomSelectEvent) => {
    /*
    Anytime a OptionsOpenEvent is fired this will get called
    so that any other optionsMenu that is open will close
    except the one that is clicked.
    */
    if (e && e.type === this.customSelectEventName) {
      const eventSource = e.detail.target;
      if (eventSource === this.selectInputEl) {
        return;
      }
    }

    this.clearActiveHighlight();
    this.activeOptionIndex = -1;
    this.numberOfSearchResults = undefined;
    this.optionsWrapper.classList.remove('options--open');
    this.optionListIsHidden = true;
    if (this.isSingleSelect) {
      this.searchTerm = '';
    }
  };
  /*
  InputChange will fire with typing && paste events
  Where key down/up will not pick up paste events
  */
  handleInputChange(e) {
    e.preventDefault();
    // if the user deletes the text
    if (!e.target.value) {
      this.resetSearchBar();
      return;
    }

    this.searchTerm = e.target.value;
    this.originalUserInput = this.searchTerm;

    if (!this.availableOptions.length) {
      this.calculateAvailableOptions();
    }
    this.filterOptionsBySearchTerm();
    this.openOptionsMenu();
  }

  handleClearSearch(e) {
    e.preventDefault();
    e.stopPropagation();
    this.resetSearchBar();
  }

  handleOptionClickSelection(e) {
    e.preventDefault();
    e.stopPropagation();
    const optionValue = e.target.getAttribute('data-option-value');
    if (optionValue) {
      this.addSelectedOption(optionValue);
      this.resetSearchBar();
    }
  }
  /*
    will fire with both character and non-character keys
    this handler is used for keyboard events and navigation
  */
  handleKeyDown(e) {
    const key: string = e.key;
    const activeOption: Element = this.optionList[this.activeOptionIndex];

    switch (key) {
      case 'ArrowDown':
        if (this.hasOptionsToNavigate()) {
          this.clearActiveHighlight();

          if (activeOption === this.optionsWrapper.lastElementChild) {
            this.searchTerm = this.originalUserInput;
            this.activeOptionIndex = -1;
            break;
          }

          this.activeOptionIndex =
            this.activeOptionIndex < this.optionList.length - 1
              ? ++this.activeOptionIndex
              : this.optionList.length - 1;

          this.addOptionHighlight(this.activeOptionIndex);
          this.searchTerm = this.getCurrentOptionValue();
        }
        break;
      case 'ArrowUp':
        if (this.hasOptionsToNavigate()) {
          // this will keep the input cursor at the end of the text.
          e.preventDefault();
          this.clearActiveHighlight();
          /*
            if active option is the first one,
            and the user hits 'ArrowUp',
            restore original input.
          */
          if (activeOption === this.optionsWrapper.firstElementChild) {
            this.searchTerm = this.originalUserInput;
            this.activeOptionIndex = -1;
            break;
          }
          // make sure the index is in range
          this.activeOptionIndex =
            this.activeOptionIndex > 0 ? --this.activeOptionIndex : -1;

          if (this.activeOptionIndex >= 0) {
            this.addOptionHighlight(this.activeOptionIndex);
            this.searchTerm = this.getCurrentOptionValue();
          } else {
            // if cursor is in searchbar, move to the bottom of the list
            this.activeOptionIndex = this.optionList.length - 1;
            this.addOptionHighlight(this.activeOptionIndex);
            this.searchTerm = this.getCurrentOptionValue();
          }
        }
        break;
      case 'Enter':
        // if there is an active option
        if (this.activeOptionIndex > -1) {
          this.addSelectedOption(this.getCurrentOptionValue());
        } else {
          // if the user hits enter in the search bar
          this.addSelectedOption(this.searchTerm);
        }
        break;
      case 'Escape':
        this.handleCloseOptions();
        break;
      default:
        break;
    }
  }
}
