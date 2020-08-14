import Header from 'querybuilder/header';

describe('Header', () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });
  it('fires a save event', () => {
    customElements.define(
      'querybuilder-header',
      Header.CustomElementConstructor
    );
    const header = document.createElement('querybuilder-header');

    document.body.appendChild(header);

    const handler = jest.fn();
    header.addEventListener('save', handler);
    const saveBtn = header.shadowRoot.querySelector('.save-button');
    saveBtn.click();

    return Promise.resolve().then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });
});
