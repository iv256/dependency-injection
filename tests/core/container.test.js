import { describe, expect, test } from 'vitest';
import di, { DIContainer, createContainer } from '../../src/index.js';

describe('DIContainer initialization', () => {

  test('default export should be a DIContainer instance', () => {
    expect(di).toBeInstanceOf(DIContainer);
  });

  test('createContainer() should create a DIContainer instance', () => {
    const container = createContainer();

    expect(container).toBeInstanceOf(DIContainer);
  });

  test('createContainer() should create independent container instances', () => {
    const containerA = createContainer();
    const containerB = createContainer();

    expect(containerA).not.toBe(containerB);
  });

  test('default container and manually created container should be independent', async () => {
    const container = createContainer();

    di.define('test.default.value', () => 'default');
    container.define('test.local.value', () => 'local');

    await expect(di.get('test.default.value')).resolves.toBe('default');
    await expect(container.get('test.local.value')).resolves.toBe('local');

    await expect(di.get('test.local.value')).rejects.toThrow();
    await expect(container.get('test.default.value')).rejects.toThrow();
  });

  test('container should expose core API methods', () => {
    const container = createContainer();

    expect(typeof container.define).toBe('function');
    expect(typeof container.get).toBe('function');
    expect(typeof container.lazy).toBe('function');
    expect(typeof container.createInstance).toBe('function');
  });

});
