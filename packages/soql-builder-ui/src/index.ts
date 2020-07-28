// @ts-ignore
import App from 'qb/app';

customElements.define('qb-app', App.CustomElementConstructor);
const app = document.createElement('qb-app');
// @ts-ignore
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);
