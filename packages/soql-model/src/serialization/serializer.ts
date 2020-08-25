import * as Soql from '../model/model';

export class ModelSerializer {
  protected model: Soql.SoqlModelObject;
  public constructor(model: Soql.SoqlModelObject) {
    this.model = model;
  }
  public serialize(options?: Soql.SyntaxOptions): string {
    return this.model.toSoqlSyntax(options);
  }
}
