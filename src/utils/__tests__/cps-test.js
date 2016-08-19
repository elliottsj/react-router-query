import {
  asyncify,
  callAndMemoize,
  isSync,
} from '../cps';

describe('asyncify', () => {
  it('sets the `isSync` symbol on the returned function', () => {
    const fn = asyncify((x, y) => x + y);
    expect(fn[isSync]).toBe(true);
  });

  it('returns a CPS function which resolves synchronously', () => {
    let done = false;
    const fn = asyncify((x, y) => x + y);
    fn(1, 2, (error, result) => {
      expect(error).toBe(null);
      expect(result).toBe(3);
      done = true;
    });
    expect(done).toBe(true);
  });
});

describe('callAndMemoize', () => {
  it(
    'creates a CPS function which resolves with the memoized result of the given CPS function',
    () => new Promise((resolve) => {
      let done = false;
      function fn(cb) {
        setImmediate(() => cb(null, 'hello'));
      }
      callAndMemoize(fn)((error1, memoizedFn) => {
        expect(error1).toBe(null);
        expect(memoizedFn).toEqual(jasmine.any(Function));
        let sync = false;
        memoizedFn((error2, result) => {
          expect(error2).toBe(null);
          expect(result).toBe('hello');
          sync = true;
        });
        expect(sync).toBe(true);
        done = true;
        resolve();
      });
      expect(done).toBe(false);
    })
  );
});
