import { diff } from 'deep-diff';
import { DeepDiff } from '../schema/audit-context';

export function computeDiff(before: unknown, after: unknown): DeepDiff | undefined {
  if (before === undefined || after === undefined || before === null || after === null) {
    return undefined;
  }

  const changes = diff(before, after);
  if (!changes || changes.length === 0) {
    return undefined;
  }

  return changes.reduce<DeepDiff>((acc, change) => {
    const path = change.path?.join('.') ?? 'root';
    acc[path] = {
      from: 'lhs' in change ? change.lhs : undefined,
      to: 'rhs' in change ? change.rhs : undefined,
      kind: change.kind,
    };
    return acc;
  }, {});
}
