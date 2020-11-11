/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Soql from '../model';
import { SoqlModelObjectImpl } from './soqlModelObjectImpl';

export class LikeConditionImpl extends SoqlModelObjectImpl implements Soql.LikeCondition {
  public constructor(public field: Soql.Field, public compareValue: Soql.CompareValue) {
    super();
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    return `${this.field.toSoqlSyntax(options)} LIKE ${this.compareValue.toSoqlSyntax(options)}`;
  }
}
