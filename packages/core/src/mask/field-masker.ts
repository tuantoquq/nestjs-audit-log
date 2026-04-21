const MASK_VALUE = '[MASKED]';

export function maskFields<T>(record: T, paths: string[] = []): T {
  if (paths.length === 0) {
    return structuredClone(record);
  }

  const clone = structuredClone(record);
  for (const path of paths) {
    maskPath(clone, path.split('.'));
  }
  return clone;
}

function maskPath(target: unknown, segments: string[]): void {
  if (!target || segments.length === 0) {
    return;
  }

  if (Array.isArray(target)) {
    for (const item of target) {
      maskPath(item, segments);
    }
    return;
  }

  if (typeof target !== 'object') {
    return;
  }

  const [head, ...tail] = segments;
  if (!head) {
    return;
  }

  const objectTarget = target as Record<string, unknown>;
  if (!(head in objectTarget)) {
    return;
  }

  if (tail.length === 0) {
    objectTarget[head] = MASK_VALUE;
    return;
  }

  maskPath(objectTarget[head], tail);
}
