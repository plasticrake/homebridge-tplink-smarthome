/* eslint-disable no-underscore-dangle */
const EventEmitter = require('events');
const { expect } = require('chai');
const rewire = require('rewire');

const { HomebridgeAPI } = require('homebridge/lib/api');

const TplinkSmarthomePlatform = rewire('../lib/platform');
const { TplinkAccessory } = require('../lib/tplink-accessory');
const {
  platformAccessories,
  platformAccessoriesIssues,
} = require('./fixtures/platform-accessories');

const log = {
  debug: () => {},
  error: () => {},
  info: () => {},
  log: () => {},
  warn: () => {},
};

describe('TplinkSmarthomePlatform', function () {
  let platform;
  let tplinkDevice;
  beforeEach(function () {
    platform = new TplinkSmarthomePlatform(log, {}, new HomebridgeAPI());

    tplinkDevice = new EventEmitter();
    Object.assign(tplinkDevice, {
      id: 'ABC',
      deviceType: 'plug',
      model: 'HS100',
      supportsDimmer: false,
      alias: 'TEST',
    });
  });

  describe('~createTplinkAccessory', function () {
    const createTplinkAccessory = TplinkSmarthomePlatform.__get__(
      'createTplinkAccessory'
    );
    // const platform = { config: { switchModels: ['HS200'] } };
    it('should create TplinkAccessory', function () {
      const accessory = createTplinkAccessory(platform, null, tplinkDevice);
      expect(accessory).to.be.instanceof(TplinkAccessory);
    });
  });

  describe('#addAccessory', function () {
    it.skip('should add platformAccessory to #homebridgeAccessories', function () {});
  });

  describe('#configureAccessory', function () {
    platformAccessories.forEach(function (platformAccessory) {
      describe(platformAccessory.displayName, function () {
        it('should add platformAccessory to #homebridgeAccessories', function () {
          platform.configureAccessory(platformAccessory);

          expect(platform.homebridgeAccessories).to.have.property('size', 1);
          expect(
            platform.homebridgeAccessories.get(platformAccessory.UUID)
          ).to.equal(platformAccessory);
        });
      });
    });

    describe('Context Missing', function () {
      it('should add platformAccessory to #homebridgeAccessories', function () {
        const platformAccessory = platformAccessoriesIssues.get(
          'CONTEXT_MISSING'
        );
        platform.configureAccessory(platformAccessory);

        expect(platform.homebridgeAccessories).to.have.property('size', 1);
        expect(
          platform.homebridgeAccessories.get(platformAccessory.UUID)
        ).to.equal(platformAccessory);
      });
    });
  });
});
