jest.unmock('../promiseAllValues');

import promiseAllValues from '../promiseAllValues';

describe('promiseAllValues', () => {
  it('returns an object with resolved values of the given promises', () =>
    promiseAllValues({
      one: Promise.resolve('oneValue'),
      two: Promise.resolve('twoValue'),
    }).then((result) => {
      expect(result).toEqual({
        one: 'oneValue',
        two: 'twoValue',
      });
    })
  );

  it('rejects with a single key-value pair of the first rejected promise', () =>
    promiseAllValues({
      pass: Promise.resolve('passValue'),
      fail: Promise.reject('failValue'),
    }).then(() => {
      throw new Error('Unexpected promise fulfillment');
    }, (error) => {
      expect(error).toEqual({
        fail: 'failValue',
      });
    })
  );
});
