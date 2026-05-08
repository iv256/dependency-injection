import { describe, expect, test } from 'vitest';

import { DIRegistry, createRegistry } from '../src/di.registry.js';
import lazyPromise from '../src/lazy.promise.js';

describe('DIRegistry', () => {

  test('createRegistry() should create a DIRegistry instance', () => {
    const registry = createRegistry();

    expect(registry).toBeInstanceOf(DIRegistry);
  });

  test('should store and return a lazy promise by string key', async () => {
    const registry = createRegistry();
    const value = lazyPromise((resolve) => resolve('test-value'));

    registry.set('services.test', value);

    expect(registry.get('services.test')).toBe(value);
    await expect(registry.get('services.test')).resolves.toBe('test-value');
  });

  test('has() should return true for registered key', () => {
    const registry = createRegistry();
    const value = lazyPromise((resolve) => resolve('test-value'));

    registry.set('services.test', value);

    expect(registry.has('services.test')).toBe(true);
  });

  test('has() should return false for missing key', () => {
    const registry = createRegistry();

    expect(registry.has('services.missing')).toBe(false);
  });

  test('get() should throw for missing key', () => {
    const registry = createRegistry();

    expect(() => registry.get('services.missing')).toThrow(
      'DIRegistry: Dependency key "services.missing" is not defined.'
    );
  });

  test('set() should throw for duplicate key', () => {
    const registry = createRegistry();
    const value = lazyPromise((resolve) => resolve('test-value'));

    registry.set('services.test', value);

    expect(() => registry.set('services.test', value)).toThrow(
      'DIRegistry: Dependency key "services.test" is already defined.'
    );
  });

  test('set() should throw if key is not a string', () => {
    const registry = createRegistry();
    const value = lazyPromise((resolve) => resolve('test-value'));

    expect(() => registry.set(123, value)).toThrow(
      'Dependency key must be a string'
    );
  });

  test('get() should throw if key is not a string', () => {
    const registry = createRegistry();

    expect(() => registry.get(123)).toThrow(
      'Dependency key must be a string'
    );
  });

  test('has() should throw if key is not a string', () => {
    const registry = createRegistry();

    expect(() => registry.has(123)).toThrow(
      'Dependency key must be a string'
    );
  });

  test('set() should throw if value is not a lazy promise', () => {
    const registry = createRegistry();

    expect(() => registry.set('services.invalid', {})).toThrow(
      'must be a lazy promise'
    );
  });

});