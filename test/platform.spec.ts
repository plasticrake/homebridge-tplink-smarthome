import { expect } from 'chai';
import { EventEmitter } from 'events';
import { HomebridgeAPI } from 'homebridge/lib/api';
// const rewire = require('rewire');

import TplinkSmarthomePlatform from '../src/platform';

// const { TplinkAccessory } = require('../lib/tplink-accessory');

import {
  platformAccessories,
  platformAccessoriesIssues,
} from './fixtures/platform-accessories';

const log = () => {};
log.prefix = '';
log.debug = () => {};
log.error = () => {};
log.info = () => {};
log.log = () => {};
log.warn = () => {};

describe('TplinkSmarthomePlatform', function () {
  let platform: TplinkSmarthomePlatform;
  let tplinkDevice: EventEmitter;
  beforeEach(function () {
    platform = new TplinkSmarthomePlatform(
      log,
      { platform: '', name: 'tplink' },
      new HomebridgeAPI()
    );

    tplinkDevice = new EventEmitter();
    Object.assign(tplinkDevice, {
      id: 'ABC',
      deviceType: 'plug',
      model: 'HS100',
      supportsDimmer: false,
      alias: 'TEST',
    });
  });

  // describe('~createTplinkAccessory', function () {
  //   const createTplinkAccessory = TplinkSmarthomePlatform.__get__(
  //     'createTplinkAccessory'
  //   );
  //   // const platform = { config: { switchModels: ['HS200'] } };
  //   it('should create TplinkAccessory', function () {
  //     const accessory = createTplinkAccessory(platform, null, tplinkDevice);
  //     expect(accessory).to.be.instanceof(TplinkAccessory);
  //   });
  // });

  describe('#addAccessory', function () {
    it.skip('should add platformAccessory to #homebridgeAccessories', function () {});
  });

  describe('#configureAccessory', function () {
    platformAccessories.forEach(function (platformAccessory) {
      describe(platformAccessory.displayName, function () {
        it('should add platformAccessory to #homebridgeAccessories', function () {
          platform.configureAccessory(platformAccessory);

          // eslint-disable-next-line @typescript-eslint/dot-notation
          const hbAccessories = platform['homebridgeAccessories'];

          expect(hbAccessories).to.be.a('Map');
          expect(hbAccessories).to.have.property('size', 1);
          expect(hbAccessories.get(platformAccessory.UUID)).to.equal(
            platformAccessory
          );
        });
      });
    });

    describe('Context Missing', function () {
      it('should add platformAccessory to #homebridgeAccessories', function () {
        const platformAccessory = platformAccessoriesIssues.get(
          'CONTEXT_MISSING'
        );
        platform.configureAccessory(platformAccessory);

        // eslint-disable-next-line @typescript-eslint/dot-notation
        const hbAccessories = platform['homebridgeAccessories'];

        expect(hbAccessories).to.be.a('Map');
        expect(hbAccessories).to.have.property('size', 1);
        expect(hbAccessories.get(platformAccessory.UUID)).to.equal(
          platformAccessory
        );
      });
    });
  });
});
