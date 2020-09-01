/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as Soql from '../model';
import { SoqlModelObjectImpl } from './soqlModelObjectImpl';

export class FieldRefImpl extends SoqlModelObjectImpl implements Soql.FieldRef {
  public fieldName: string;
  public alias?: Soql.UnmodeledSyntax;
  public constructor(fieldName: string, alias?: Soql.UnmodeledSyntax) {
    super();
    this.fieldName = fieldName;
    this.alias = alias;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    return this.alias
      ? `${this.fieldName} ${this.alias.toSoqlSyntax(options)}`
      : this.fieldName;
  }
}
