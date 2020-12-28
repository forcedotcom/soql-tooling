import { api, track, LightningElement } from 'lwc';

export default class CustomSelect extends LightningElement {
  @api isLoading = false;
  @api allFields: string[];
  @api selectedFields: string[] = [];
  @track _renderedFields: string[] = []; // the fields that are rendered for the user to select
  searchTerm = '';
  originalUserInput = '';
  fieldSearchBar: HTMLInputElement;
  optionsWrapper: HTMLElement;
  optionList: HTMLCollection;
  optionListIsOpen = false;
  availableFields: string[] = []; // all possible fields minus the selected fields.
  activeOptionIndex = -1;

  getAvailableFields() {
    const lowerCaseSelections = this.selectedFields.map((field) => {
      return field.toLowerCase();
    });

    this.availableFields = this.allFields.filter((field) => {
      return !lowerCaseSelections.includes(field.toLowerCase());
    });
  }

  get hasSearchTerm() {
    return !!this.searchTerm;
  }

  get placeholderText() {
    // TODO: i18n
    return this.isLoading ? 'Loading...' : 'Search fields...';
  }
  // close the options menu when user click outside element
  connectedCallback() {
    document.addEventListener('click', () => {
      this.handleCloseOptions();
    });
  }

  renderedCallback() {
    this.optionsWrapper = this.template.querySelector('.options__wrapper');
    this.fieldSearchBar = this.template.querySelector(
      'input[name=fieldSearchBar]'
    );
    this.optionList = this.optionsWrapper.children;
  }

  handleCloseOptions() {
    this.clearActiveHighlight();
    this.activeOptionIndex = -1;
    this.optionsWrapper.classList.remove('options--open');
    this.optionListIsOpen = false;
  }

  openOptionsMenu() {
    this.optionsWrapper.classList.add('options--open');
    this.optionListIsOpen = true;
  }
  // called when user click on select input, should be clicks on wrapper?
  handleOpenOptions(e) {
    e.preventDefault();
    e.stopPropagation();
    this.getAvailableFields();
    this._renderedFields = this.availableFields;
    this.openOptionsMenu();
  }

  filterFieldsBySearchTerm() {
    if (this.searchTerm) {
      const filteredFields = this.availableFields.filter((field) => {
        return field.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
      this._renderedFields = filteredFields;
    }
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
    this.filterFieldsBySearchTerm();
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
      this.addSelectedField(optionValue);
      this.resetSearchBar();
    } else {
      console.log('NO Option Value from DOM!');
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
          this.addSelectedField(this.getCurrentOptionValue());
        } else {
          // if the user hits enter in the search bar
          this.addSelectedField(this.searchTerm);
        }
        break;
      case 'Escape':
        this.handleCloseOptions();
        break;
      default:
        break;
    }
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

  getCurrentOptionValue(): string {
    return this.optionList[this.activeOptionIndex]
      ? this.optionList[this.activeOptionIndex].getAttribute(
          'data-option-value'
        )
      : '';
  }

  addSelectedField(fieldName: string = this.searchTerm) {
    const validFieldMatch: string[] = this.availableFields.filter((field) => {
      return field.toLowerCase() === fieldName.toLowerCase();
    });

    if (validFieldMatch.length) {
      const field = validFieldMatch[0];
      const fieldSelectionEvent = new CustomEvent('field__selection', {
        detail: {
          field
        }
      });
      this.dispatchEvent(fieldSelectionEvent);
      this.resetSearchBar();
    } else {
      console.error('that is not a valid field');
    }
  }

  resetSearchBar() {
    this.clearActiveHighlight();
    this.handleCloseOptions();
    this.searchTerm = '';
    this.originalUserInput = '';
    this.activeOptionIndex = -1;
  }

  haveOptionsToNavigate() {
    return this.optionListIsOpen && this.optionList.length;
  }
}
