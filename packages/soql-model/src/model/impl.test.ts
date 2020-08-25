import * as Impl from './impl';
import { SyntaxOptions } from './model';

describe('SoqlModelObjectImpl should', () => {
  const testModelObject = new Impl.UnmodeledSyntaxImpl('mick');
  it('use SyntaxOptions that are passed in', () => {
    const expectedSyntaxOptions = new SyntaxOptions();
    expectedSyntaxOptions.indent = 50;
    expectedSyntaxOptions.wrapColumn = 50;
    const actualSyntaxOptions = testModelObject.getSyntaxOptions(
      expectedSyntaxOptions
    );
    expect(actualSyntaxOptions).toBe(expectedSyntaxOptions);
  });
  it('create default SyntaxOptions if none are passed in', () => {
    const expectedSyntaxOptions = new SyntaxOptions();
    const actualSyntaxOptions = testModelObject.getSyntaxOptions();
    expect(actualSyntaxOptions).toEqual(expectedSyntaxOptions);
  });
});

describe('UnmodeledSyntaxImpl should', () => {
  it('store a string as unmodeledSyntax', () => {
    const expected = { unmodeledSyntax: 'ronnie' };
    const actual = new Impl.UnmodeledSyntaxImpl(expected.unmodeledSyntax);
    expect(actual).toEqual(expected);
  });
  it('return stored syntax for toSoqlSyntax()', () => {
    const expected = 'keith';
    const actual = new Impl.UnmodeledSyntaxImpl(expected).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});

describe('FieldRefImpl should', () => {
  it('store a string field name as fieldName', () => {
    const expected = { fieldName: 'charlie' };
    const actual = new Impl.FieldRefImpl(expected.fieldName);
    expect(actual).toEqual(expected);
  });
  it('store an unmodeled syntax object as the alias', () => {
    const expected = { fieldName: 'brian', alias: { unmodeledSyntax: 'bill' } };
    const actual = new Impl.FieldRefImpl(
      expected.fieldName,
      new Impl.UnmodeledSyntaxImpl(expected.alias.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return field name followed by alias for toSoqlSyntax()', () => {
    const expected = 'rolling stones';
    const actual = new Impl.FieldRefImpl(
      'rolling',
      new Impl.UnmodeledSyntaxImpl('stones')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});

describe('SelectExprsImpl should', () => {
  it('store select expressions', () => {
    const expected = {
      selectExpressions: [{ fieldName: 'sticky' }, { fieldName: 'fingers' }],
    };
    const actual = new Impl.SelectExprsImpl([
      new Impl.FieldRefImpl(expected.selectExpressions[0].fieldName),
      new Impl.FieldRefImpl(expected.selectExpressions[1].fieldName),
    ]);
    expect(actual).toEqual(expected);
  });
  it('return SELECT * when there are no select expressions for toSoqlSyntax()', () => {
    const expected = 'SELECT *';
    const actual = new Impl.SelectExprsImpl([]).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
  it('return comma separated list of fields for toSoqlSyntax()', () => {
    const expected = 'SELECT let, it, bleed';
    const actual = new Impl.SelectExprsImpl([
      new Impl.FieldRefImpl('let'),
      new Impl.FieldRefImpl('it'),
      new Impl.FieldRefImpl('bleed'),
    ]).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});

describe('FromImpl should', () => {
  it('store SObject name as a string', () => {
    const expected = { sobjectName: 'ian' };
    const actual = new Impl.FromImpl('ian');
    expect(actual).toEqual(expected);
  });
  it('store as and using clauses as unmodeled syntax', () => {
    const expected = {
      sobjectName: 'black',
      as: { unmodeledSyntax: 'and' },
      using: { unmodeledSyntax: 'blue' },
    };
    const actual = new Impl.FromImpl(
      expected.sobjectName,
      new Impl.UnmodeledSyntaxImpl(expected.as.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.using.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return FROM sobject name followed by as and using clauses for toSoqlSyntax()', () => {
    const expected = 'FROM exile on main';
    const actual = new Impl.FromImpl(
      'exile',
      new Impl.UnmodeledSyntaxImpl('on'),
      new Impl.UnmodeledSyntaxImpl('main')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});

describe('QueryImpl should', () => {
  it('store query components as appropriate model objects', () => {
    const expected = {
      select: { selectExpressions: [] },
      from: { sobjectName: 'songs' },
      where: { unmodeledSyntax: 'paint it back' },
      with: { unmodeledSyntax: 'gimme shelter' },
      groupBy: { unmodeledSyntax: 'start me up' },
      orderBy: { unmodeledSyntax: 'angie' },
      limit: { unmodeledSyntax: 'honky tonk woman' },
      offset: { unmodeledSyntax: 'wild horses' },
      bind: { unmodeledSyntax: 'miss you' },
      recordTrackingType: { unmodeledSyntax: 'satisfaction' },
      update: { unmodeledSyntax: 'under my thumb' },
    };
    const actual = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([]),
      new Impl.FromImpl(expected.from.sobjectName),
      new Impl.UnmodeledSyntaxImpl(expected.where.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.with.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.groupBy.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.orderBy.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.limit.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.offset.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.bind.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.recordTrackingType.unmodeledSyntax),
      new Impl.UnmodeledSyntaxImpl(expected.update.unmodeledSyntax)
    );
    expect(actual).toEqual(expected);
  });
  it('return query string, one line per clause with all but SELECT clause indented for toSoqlSyntax()', () => {
    const expected = 'SELECT *\n' + '  FROM songs\n' + '  paint it black\n';
    const actual = new Impl.QueryImpl(
      new Impl.SelectExprsImpl([]),
      new Impl.FromImpl('songs'),
      new Impl.UnmodeledSyntaxImpl('paint it black')
    ).toSoqlSyntax();
    expect(actual).toEqual(expected);
  });
});
