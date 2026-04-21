import { computeDiff } from '../src/diff/deep-diff';

describe('computeDiff', () => {
  it('returns flattened changes for edited and new fields', () => {
    expect(
      computeDiff(
        { name: 'A', profile: { age: 1 } },
        { name: 'B', profile: { age: 1 }, active: true },
      ),
    ).toEqual({
      name: { from: 'A', to: 'B', kind: 'E' },
      active: { from: undefined, to: true, kind: 'N' },
    });
  });

  it('returns undefined when either side is missing', () => {
    expect(computeDiff(undefined, { id: '1' })).toBeUndefined();
  });
});
