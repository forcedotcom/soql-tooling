/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Soql from '../model';
import { SoqlModelObjectImpl } from './soqlModelObjectImpl';

export class LimitImpl extends SoqlModelObjectImpl implements Soql.Limit {
  public limit: number;
  public constructor(limit: number) {
    super();
    this.limit = limit;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    return `LIMIT ${this.limit}`;
  }
}
