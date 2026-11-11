import { describe, expect, it } from 'vitest';
import merge from 'deepmerge';

describe('Svelte build configuration merging', () => {
  it('does not inherit a poisoned prototype from target properties', () => {
    const target = { ['__proto__']: { poisoned: true }, safe: 'retained' };
    const result = merge(target, { compilerOptions: { dev: true } });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Reflect.has(result, 'poisoned')).toBe(false);
    expect(result.safe).toBe('retained');
  });

  it('does not inherit a poisoned prototype while cloning nested options', () => {
    const result = merge({ nested: { ['__proto__']: { poisoned: true } } }, {});
    expect(Object.getPrototypeOf(result.nested)).toBe(Object.prototype);
    expect(Reflect.has(result.nested, 'poisoned')).toBe(false);
  });

  it('preserves the Svelte plugin custom array replacement and option merging', () => {
    const result = merge(
      { compilerOptions: { dev: false, css: 'external' }, extensions: ['.svelte'] },
      { compilerOptions: { dev: true }, extensions: ['.svelte', '.svelte.md'] },
      { arrayMerge: (_target, source) => source }
    );
    expect(result.compilerOptions).toEqual({ dev: true, css: 'external' });
    expect(result.extensions).toEqual(['.svelte', '.svelte.md']);
  });
});
