import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Service } from 'hap-nodejs';

import { deferAndCombine, delay, isObjectLike, lookup } from '../src/utils';

chai.use(sinonChai);

describe('utils', function () {
  describe('deferAndCombine', function () {
    let spy: sinon.SinonSpy;
    let deferredFn: () => Promise<unknown>;
    const deferTime = 100;

    beforeEach(function () {
      let index = 0;
      spy = sinon.spy();
      deferredFn = deferAndCombine(() => {
        index += 1;
        return new Promise((resolve) => {
          spy(index);
          resolve(index);
        });
      }, deferTime);
    });

    it('should batch 3 calls made within the timeout', async function () {
      this.timeout(deferTime * 2);
      this.slow(deferTime * 1.2);

      const startTimer = Date.now();
      const results = await Promise.all([
        deferredFn(),
        deferredFn(),
        deferredFn(),
      ]);
      expect(Date.now() - startTimer)
        .to.be.at.least(deferTime)
        .and.be.at.most(deferTime * 1.1);
      expect(spy).to.be.calledOnceWithExactly(1);
      expect(results).to.have.lengthOf(3);
      expect(results).to.eql([1, 1, 1]);
    });

    it('should separately batch calls made outside the timeout', async function () {
      this.timeout(deferTime * 4);
      this.slow(deferTime * 2.4);

      const startTimer = Date.now();

      const batchOne = Promise.all([deferredFn(), deferredFn(), deferredFn()]);

      await delay(deferTime);
      const batchTwo = Promise.all([deferredFn(), deferredFn()]);

      const resultsOne = await batchOne;
      const resultsTwo = await batchTwo;

      expect(Date.now() - startTimer)
        .to.be.at.least(deferTime * 2)
        .and.be.at.most(deferTime * 2.2);
      expect(spy).to.be.calledTwice;
      expect(spy).to.be.calledWith(1);

      expect(resultsOne).to.have.lengthOf(3);
      expect(resultsOne).to.eql([1, 1, 1]);

      expect(resultsTwo).to.have.lengthOf(2);
      expect(resultsTwo).to.eql([2, 2]);
    });
  });

  describe('lookup', function () {
    it('should lookup with default compareFn', function () {
      expect(lookup({ aKey: 'a', bKey: 'b' }, undefined, 'a')).to.eql('aKey');
    });

    it('should lookup with compareFn', function () {
      expect(
        lookup(
          { aKey: { key: 'a' }, bKey: { key: 'b' } },
          (objProp, search) =>
            isObjectLike(objProp) && 'key' in objProp && objProp.key === search,
          'b'
        )
      ).to.eql('bKey');
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
      ).to.equal('Outlet');
    });
  });
});
