import { api, track, LightningElement } from 'lwc';

export default class CustomSelect extends LightningElement {
  @api isLoading = false;
  @api allOptions: string[];
  @api selectedOptions: string[] = [];
  @track _renderedOptions: string[] = []; // the options that are rendered for the user to select
  _placeholderText = '';
  searchTerm = '';
  originalUserInput = '';
  optionsWrapper: HTMLElement;
  optionList: HTMLCollection;
  optionListIsOpen = false;
  availableOptions: string[] = []; // all possible options minus the selected options.
  activeOptionIndex = -1;

  get hasSearchTerm() {
    return !!this.searchTerm;
  }

  @api
  get placeholderText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : this._placeholderText;
  }

  set placeholderText(text: string) {
    this._placeholderText = text;
  }

  /* ======= LIFECYCLE HOOKS ======= */

  // close the options menu when user click outside element
  connectedCallback() {
    document.addEventListener('click', () => {
      this.handleCloseOptions();
    });
  }

  renderedCallback() {
    this.optionsWrapper = this.template.querySelector('.options__wrapper');
    this.optionList = this.optionsWrapper.children;
  }

  /* ======= UTILITIES ======= */

  getAvailableOptions() {
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
          optionValue
        }
      });
      this.dispatchEvent(optionSelectionEvent);
      this.resetSearchBar();
    } else {
      console.error('that is not a valid field');
    }
  }

  haveOptionsToNavigate() {
    return this.optionListIsOpen && this.optionList.length;
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
        behavior: 'smooth',
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
  }

  openOptionsMenu() {
    this.optionsWrapper.classList.add('options--open');
    this.optionListIsOpen = true;
  }

  /* ======= EVENT HANDLERS ======= */

  // called when user clicks on search bar input
  handleOpenOptions(e) {
    e.preventDefault();
    e.stopPropagation();
    this.getAvailableOptions();
    this._renderedOptions = this.availableOptions;
    this.openOptionsMenu();
  }

  handleCloseOptions() {
    this.clearActiveHighlight();
    this.activeOptionIndex = -1;
    this.optionsWrapper.classList.remove('options--open');
    this.optionListIsOpen = false;
  }
  // respond to changes in input value, typing, paste.
  handleInputChange(e) {
    e.preventDefault();
    this.openOptionsMenu();
    // if the user deletes the text
    if (!e.target.value) {
      this.resetSearchBar();
      return;
    }

    this.searchTerm = e.target.value;
    this.originalUserInput = this.searchTerm;
    this.filterOptionsBySearchTerm();
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
        if (this.haveOptionsToNavigate()) {
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
        if (this.haveOptionsToNavigate()) {
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
