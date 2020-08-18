// @ts-ignore
import { createElement } from 'lwc';
import Header from 'querybuilder/header';

describe('Header', () => {
  const header = createElement('querybuilder-header', {
    is: Header
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('emits a save event', () => {
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
