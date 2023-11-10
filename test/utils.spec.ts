import { Service } from 'hap-nodejs';

import { deferAndCombine, delay, isObjectLike, lookup } from '../src/utils';

describe('utils', function () {
  describe('deferAndCombine', function () {
    let spy: jest.Mock;
    let deferredFn: () => Promise<unknown>;
    const deferTime = 100;

    beforeEach(function () {
      let index = 0;
      spy = jest.fn();
      deferredFn = deferAndCombine(() => {
        index += 1;
        return new Promise((resolve) => {
          spy(index);
          resolve(index);
        });
      }, deferTime);
    });

    it(
      'should batch 3 calls made within the timeout',
      async function () {
        const startTimer = Date.now();
        const results = await Promise.all([
          deferredFn(),
          deferredFn(),
          deferredFn(),
        ]);
        expect(Date.now() - startTimer).toBeGreaterThanOrEqual(deferTime);
        expect(Date.now() - startTimer).toBeLessThanOrEqual(deferTime * 1.1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(1);
        expect(results).toEqual([1, 1, 1]);
      },
      deferTime * 2
    );

    it(
      'should separately batch calls made outside the timeout',
      async function () {
        const startTimer = Date.now();

        const batchOne = Promise.all([
          deferredFn(),
          deferredFn(),
          deferredFn(),
        ]);

        await delay(deferTime);
        const batchTwo = Promise.all([deferredFn(), deferredFn()]);

        const resultsOne = await batchOne;
        const resultsTwo = await batchTwo;

        expect(Date.now() - startTimer).toBeGreaterThanOrEqual(deferTime * 2);
        expect(Date.now() - startTimer).toBeLessThanOrEqual(deferTime * 2.2);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(1);

        expect(resultsOne).toEqual([1, 1, 1]);
        expect(resultsTwo).toEqual([2, 2]);
      },
      deferTime * 4
    );
  });

  describe('lookup', function () {
    it('should lookup with default compareFn', function () {
      expect(lookup({ aKey: 'a', bKey: 'b' }, undefined, 'a')).toEqual('aKey');
    });

    it('should lookup with compareFn', function () {
      expect(
        lookup(
          { aKey: { key: 'a' }, bKey: { key: 'b' } },
          (objProp, search) =>
            isObjectLike(objProp) && 'key' in objProp && objProp.key === search,
          'b'
        )
      ).toEqual('bKey');
    });

    it('should lookup Service', function () {
      expect(
        lookup(
          Service,
          (objProp, search) => {
            return (
              isObjectLike(objProp) &&
              'UUID' in objProp &&
              objProp.UUID === search.UUID
            );
          },
          Service.Outlet
        )
      ).toEqual('Outlet');
    });
  });
});
