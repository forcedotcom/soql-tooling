/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement } from 'lwc';
import { convertUiModelToSoql } from '../services/soqlUtils';

export default class QueryPreview extends LightningElement {
  @api
  query;
  get queryPreview() {
    return convertUiModelToSoql(this.query);
  }
}
