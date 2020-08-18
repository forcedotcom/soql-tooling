import { createElement } from 'lwc';
import Fields from 'querybuilder/fields';

describe('Fields', () => {
  const fields = createElement('querybuilder-fields', {
    is: Fields
  });

  beforeEach(() => {
    fields.fields = ['foo', 'bar', 'baz'];
    fields.selectedFields = [];
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('emits event when field is selected', () => {
    document.body.appendChild(fields);

    const handler = jest.fn();
    fields.addEventListener('fieldselected', handler);

    const fieldOption = fields.shadowRoot.querySelector("option[value='foo']");
    fieldOption.click();

    expect(handler).toHaveBeenCalled();
  });

  it('emits event when a field is removed', () => {
    fields.selectedFields = ['foo', 'bar'];
    document.body.appendChild(fields);

    const handler = jest.fn();
    fields.addEventListener('fieldremoved', handler);

    const selectedFieldCloseEl = fields.shadowRoot.querySelector(
      "[data-field='foo']"
    );
    selectedFieldCloseEl.click();

    expect(handler).toHaveBeenCalled();
  });

  it('renders the selected fields in the component', () => {
    document.body.appendChild(fields);

    let selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
    expect(selectedFieldEl.length).toBe(0);

    const fieldOptions = fields.fields;
    fields.selectedFields = fieldOptions;

    return Promise.resolve().then(() => {
      selectedFieldEl = fields.shadowRoot.querySelectorAll('.selected-field');
      expect(selectedFieldEl.length).toBe(3);
    });
  });
});
