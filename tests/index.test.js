/**
 * Public composition root tests.
 *
 * These tests verify that the library public API is assembled correctly.
 * The goal of these tests is not to re-test core container logic or
 * extension internals, but to ensure that:
 *
 * - the public composition root exports expected APIs;
 * - the default container is assembled correctly;
 * - extensions are attached to the public container;
 * - the core container remains isolated from optional extensions.
 */

import { describe, it, expect } from 'vitest';

import di, {
  DIContainer,
  createContainer,
  createCoreContainer,
  useInjector,
} from '../src/index.js';

describe('public composition root', () => {

  it('exports expected public APIs', () => {
    expect(typeof createContainer).toBe('function');
    expect(typeof createCoreContainer).toBe('function');
    expect(typeof useInjector).toBe('function');
    expect(typeof DIContainer).toBe('function');
  });

  it('creates core container without extensions', () => {
    const core = createCoreContainer();

    expect(core).toBeInstanceOf(DIContainer);

    expect(core.createClassInstance).toBeUndefined();
    expect(core.createInstance).toBeUndefined();
  });

  it('creates public container with default extensions', () => {
    const container = createContainer();

    expect(container).toBeInstanceOf(DIContainer);

    expect(typeof container.createClassInstance).toBe('function');
    expect(typeof container.createInstance).toBe('function');
  });

  it('exports default public container instance', () => {
    expect(di).toBeInstanceOf(DIContainer);

    expect(typeof di.createClassInstance).toBe('function');
    expect(typeof di.createInstance).toBe('function');
  });

});