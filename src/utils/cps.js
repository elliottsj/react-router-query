import asyncAsyncify from 'async/asyncify';
import seq from 'async/seq';

export const isSync =
  Symbol('A boolean value indicating if a CPS function will resolve synchronously');

/**
 * Take a sync function and make it async, synchronously passing its return value to a callback.
 */
export function asyncify(fn: Function) {
  const asyncFn = asyncAsyncify(fn);
  asyncFn[isSync] = true;
  return asyncFn;
}

/**
 * Take an async function previously `asyncify`-ed and make it synchronous again.
 * If the given function does not resolve synchronously, return undefined.
 */
export function syncify(fn, ...args) {
  if (!fn[isSync]) {
    return undefined;
  }
  let value;
  fn(...args, (error, result) => {
    if (error) {
      throw error;
    }
    value = result;
  });
  return value;
}

/**
 * Immediately call `fn()` and resolve with a CPS function which resolves synchronously with the
 * original resolved value of `fn()`.
 */
type CallAndMemoizeType<T> =
  (fn: CPSFunction0<T>) => (cb: CPSCallback<CPSFunction0<T>>) => void;
export const callAndMemoize: CallAndMemoizeType<*> =
  (fn) => seq(fn, asyncify(result => asyncify(() => result)));
