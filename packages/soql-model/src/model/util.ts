/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export namespace SoqlModelUtils {
  export function containsUnmodeledSyntax(model: object): boolean {
    if ('unmodeledSyntax' in model) {
      return true;
    }
    for (const property in model) {
      if (typeof (model as any)[property] === 'object') {
        const hasUnmodeledSyntax = containsUnmodeledSyntax(
          (model as any)[property]
        );
        if (hasUnmodeledSyntax) {
          return true;
        }
      }
    }
    return false;
  }
}
