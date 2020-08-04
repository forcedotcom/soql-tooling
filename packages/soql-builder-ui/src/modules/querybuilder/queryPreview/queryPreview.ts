import { api, LightningElement } from 'lwc';

export default class QueryPreview extends LightningElement {
    @api
    query;
    get queryPreview() {
        return JSON.stringify(this.query);
    }
}
