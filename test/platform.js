/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');
const rewire = require('rewire');

const { API } = require('homebridge/lib/api');

const TplinkSmarthomePlatform = rewire('../lib/platform');
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

describe('TplinkSmarthomePlatform', function() {
  let platform;
  beforeEach(function() {
    platform = new TplinkSmarthomePlatform(log, {}, new API());
  });

  describe('~createTplinkAccessory', function() {
    const createTplinkAccessory = TplinkSmarthomePlatform.__get__(
      'createTplinkAccessory'
    );
    // const platform = { config: { switchModels: ['HS200'] } };
    it('should add platformAccessory to #homebridgeAccessories', function() {
      createTplinkAccessory(platform);
    });
  });

  describe('#addAccessory', function() {
    it('should add platformAccessory to #homebridgeAccessories', function() {});
  });

  describe('#configureAccessory', function() {
    platformAccessories.forEach(function(platformAccessory) {
      describe(platformAccessory.displayName, function() {
        it('should add platformAccessory to #homebridgeAccessories', function() {
          platform.configureAccessory(platformAccessory);

          expect(platform.homebridgeAccessories).to.have.property('size', 1);
          expect(
            platform.homebridgeAccessories.get(platformAccessory.UUID)
          ).to.equal(platformAccessory);
        });
      });
    });

    describe('Context Missing', function() {
      it('should add platformAccessory to #homebridgeAccessories', function() {
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
