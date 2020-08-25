/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import * as Soql from './model';

abstract class SoqlModelObjectImpl {
  public getSyntaxOptions(options?: Soql.SyntaxOptions): Soql.SyntaxOptions {
    if (options) {
      return options;
    } else {
      return new Soql.SyntaxOptions();
    }
  }
}

export class QueryImpl extends SoqlModelObjectImpl implements Soql.Query {
  public select: Soql.Select;
  public from: Soql.From;
  public where?: Soql.Where;
  public with?: Soql.With;
  public groupBy?: Soql.GroupBy;
  public orderBy?: Soql.OrderBy;
  public limit?: Soql.Limit;
  public offset?: Soql.Offset;
  public bind?: Soql.Bind;
  public recordTrackingType?: Soql.RecordTrackingType;
  public update?: Soql.Update;
  public constructor(
    select: Soql.Select,
    from: Soql.From,
    where?: Soql.Where,
    soqlwith?: Soql.With,
    groupBy?: Soql.GroupBy,
    orderBy?: Soql.OrderBy,
    limit?: Soql.Limit,
    offset?: Soql.Offset,
    bind?: Soql.Bind,
    recordTrackingType?: Soql.RecordTrackingType,
    update?: Soql.Update
  ) {
    super();
    this.select = select;
    this.from = from;
    this.where = where;
    this.with = soqlwith;
    this.groupBy = groupBy;
    this.orderBy = orderBy;
    this.limit = limit;
    this.offset = offset;
    this.bind = bind;
    this.recordTrackingType = recordTrackingType;
    this.update = update;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    const _options = this.getSyntaxOptions(options);
    let syntax = `${this.select.toSoqlSyntax(_options)}${os.EOL}`;
    syntax += `${' '.repeat(_options.indent)}${this.from.toSoqlSyntax(
      _options
    )}${os.EOL}`;
    if (this.where) {
      syntax += `${' '.repeat(_options.indent)}${this.where.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.with) {
      syntax += `${' '.repeat(_options.indent)}${this.with.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.groupBy) {
      syntax += `${' '.repeat(_options.indent)}${this.groupBy.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.orderBy) {
      syntax += `${' '.repeat(_options.indent)}${this.orderBy.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.limit) {
      syntax += `${' '.repeat(_options.indent)}${this.limit.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.offset) {
      syntax += `${' '.repeat(_options.indent)}${this.offset.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.bind) {
      syntax += `${' '.repeat(_options.indent)}${this.bind.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    if (this.recordTrackingType) {
      syntax += `${' '.repeat(
        _options.indent
      )}${this.recordTrackingType.toSoqlSyntax(_options)}${os.EOL}`;
    }
    if (this.update) {
      syntax += `${' '.repeat(_options.indent)}${this.update.toSoqlSyntax(
        _options
      )}${os.EOL}`;
    }
    return syntax;
  }
}

export class FromImpl extends SoqlModelObjectImpl implements Soql.From {
  public sobjectName: string;
  public as?: Soql.UnmodeledSyntax;
  public using?: Soql.UnmodeledSyntax;
  public constructor(
    sobjectName: string,
    as?: Soql.UnmodeledSyntax,
    using?: Soql.UnmodeledSyntax
  ) {
    super();
    this.sobjectName = sobjectName;
    this.as = as;
    this.using = using;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    let syntax = `FROM ${this.sobjectName}`;
    if (this.as) {
      syntax += ` ${this.as.toSoqlSyntax(options)}`;
    }
    if (this.using) {
      syntax += ` ${this.using.toSoqlSyntax(options)}`;
    }
    return syntax;
  }
}

export class SelectExprsImpl extends SoqlModelObjectImpl
  implements Soql.SelectExprs {
  public selectExpressions: Soql.SelectExpression[];
  public constructor(selectExpressions: Soql.SelectExpression[]) {
    super();
    this.selectExpressions = selectExpressions;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    let syntax: string = 'SELECT ';
    let first: boolean = true;
    if (this.selectExpressions.length > 0) {
      this.selectExpressions.forEach((selectExpression) => {
        if (!first) {
          syntax += ', ';
        }
        syntax += selectExpression.toSoqlSyntax(options);
        first = false;
      });
    } else {
      syntax += '*';
    }
    return syntax;
  }
}

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

export class UnmodeledSyntaxImpl extends SoqlModelObjectImpl
  implements Soql.UnmodeledSyntax {
  public unmodeledSyntax: string;
  public constructor(syntax: string) {
    super();
    this.unmodeledSyntax = syntax;
  }
  public toSoqlSyntax(options?: Soql.SyntaxOptions): string {
    return this.unmodeledSyntax;
  }
}
