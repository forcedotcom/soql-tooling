/*
 *  Copyright (c) 2020, salesforce.com, inc.
 *  All rights reserved.
 *  Licensed under the BSD 3-Clause license.
 *  For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 *
 */

import { api, LightningElement } from 'lwc';

export default class Where extends LightningElement {
  @api whereFields: string[];
  // _local_list of where claused to render
  // API is different than whats rendered
  // add a phantom where group to render, only until the criteria is filled out
}
