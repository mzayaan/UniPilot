/// <reference types="jest" />
import React from 'react';
import renderer from 'react-test-renderer';

// Prevent React 18 from throwing errors about state updates outside act().
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;

export function renderHook<T>(hook: () => T) {
  const result: { current: T } = { current: undefined as unknown as T };

  function Wrapper() {
    result.current = hook();
    return null;
  }

  renderer.create(React.createElement(Wrapper));
  return { result };
}

export async function waitFor(
  callback: () => void,
  { timeout = 5000, interval = 50 } = {}
): Promise<void> {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    await new Promise<void>(r => setTimeout(r, interval));
    try {
      callback();
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function act(callback: () => Promise<void>): Promise<void> {
  await callback();
  await new Promise<void>(r => setTimeout(r, 0));
}
