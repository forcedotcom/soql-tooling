// @ts-ignore
import App from 'querybuilder/app';

customElements.define('querybuilder-app', App.CustomElementConstructor);
const app = document.createElement('querybuilder-app');
// @ts-ignore
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);
