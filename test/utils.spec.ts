import { expect } from 'chai';

import { Service } from 'hap-nodejs';

import { isObjectLike, lookup } from '../src/utils';

describe('utils', function () {
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
