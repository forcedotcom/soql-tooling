import { api, track, LightningElement } from 'lwc';

interface CustomSelectEvent extends CustomEvent {
  detail: {
    target: HTMLInputElement;
  };
}

export default class CustomSelect extends LightningElement {
  @api multiple = false;
  @api isLoading = false;
  @api allOptions: string[];
  @api selectedOptions: string[] = [];
  @track _renderedOptions: string[] = [];
  availableOptions: string[] = [];
  _placeholderText = '';
  searchTerm = '';
  originalUserInput = '';
  selectInputEl: HTMLInputElement;
  optionsWrapper: HTMLElement;
  optionList: HTMLCollection;
  optionListIsHidden = true;
  activeOptionIndex = -1;
  numberOfSearchResults;
  customSelectEventName = 'customselect__optionsopened';
  //getter setter value =

  get hasSearchTerm() {
    return !!this.searchTerm;
  }

  get noResultsFound() {
    return this.hasSearchTerm && this.numberOfSearchResults === 0;
  }

  @api
  get placeholderText() {
    // TODO: i18n
    return this.isLoading
      ? 'Loading...'
      : !this.multiple && this.selectedOptions.length
      ? this.selectedOptions[0]
      : this._placeholderText;
  }

  set placeholderText(text: string) {
    this._placeholderText = text;
  }

  /* ======= LIFECYCLE HOOKS ======= */

  // close the options menu when user click outside element
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
    }
  }

  getCurrentOptionValue(): string {
    return this.optionList[this.activeOptionIndex]
      ? this.optionList[this.activeOptionIndex].getAttribute(
          'data-option-value'
        )
      : '';
  }

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
          value: optionValue
        }
      });
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
        inline: 'nearest'
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

  /* ======= EVENT HANDLERS ======= */

  sendOptionsOpenEvent(e: Event) {
    const optionsOpenedEvent = new CustomEvent(this.customSelectEventName, {
      detail: { target: e.target },
      bubbles: true,
      composed: true
    }) as CustomSelectEvent;

    this.dispatchEvent(optionsOpenedEvent);
  }

  // called when user clicks on search bar input
  handleOpenOptions(e) {
    e.preventDefault();
    e.stopPropagation();
    this.calculateAvailableOptions();
    if (this.hasSearchTerm) {
      this.filterOptionsBySearchTerm();
    } else {
      this._renderedOptions = this.availableOptions;
    }
    this.sendOptionsOpenEvent(e);
    this.openOptionsMenu();
  }

  /**
   * This syntax allow the function to retain context of this
   * while also usable with addEventListener and removeEventListener
   */
  handleCloseOptions = (e?: CustomSelectEvent) => {
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
  };
  // respond to changes in input value: typing, paste events.
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
  // will fire with both character and non-character keys
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
