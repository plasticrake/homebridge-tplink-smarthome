/* eslint-disable no-underscore-dangle, no-unused-expressions */
const path = require('path');
const fs = require('fs-extra');
const { expect, ...chai } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const hap = require('hap-nodejs');
const { Server } = require('homebridge/lib/server');
const { Plugin } = require('homebridge/lib/plugin');
const { User } = require('homebridge/lib/user');

chai.use(sinonChai);

const setupHomebridge = function setupHomebridge(scenario) {
  Plugin.addPluginPath(path.resolve(__dirname, '..', '..'));

  const scenarioDir = path.resolve(
    __dirname,
    'fixtures',
    'homebridge',
    scenario
  );
  const tempDir = path.resolve(__dirname, 'fixtures', 'temp');

  fs.emptyDirSync(tempDir);
  fs.copySync(scenarioDir, tempDir);

  User.setStoragePath(tempDir);

  hap.init(User.persistPath());

  return new Server({
    hideQRCode: true,
  });
};

const spyOnPlatformCtor = function spyOnPlatformCtor(homebridgeServer) {
  const platformCtor =
    homebridgeServer._api._platforms[
      'homebridge-tplink-smarthome.TplinkSmarthome'
    ];

  const tplinkSmarthomePlatformSpy = sinon.spy(platformCtor);

  // eslint-disable-next-line no-param-reassign
  homebridgeServer._api._platforms[
    'homebridge-tplink-smarthome.TplinkSmarthome'
  ] = tplinkSmarthomePlatformSpy;

  return tplinkSmarthomePlatformSpy;
};

const teardownHomebridge = function teardownHomebridge(homebridgeServer) {
  homebridgeServer._teardown();
  homebridgeServer._api.emit('shutdown');
};

describe('homebridge', function () {
  describe('startup', function () {
    [
      { scenario: 'fresh-no-config', shouldCallPlatformConstructor: false },
      { scenario: 'fresh-with-config', shouldCallPlatformConstructor: true },
      {
        scenario: 'persist-no-accessories-with-config',
        shouldCallPlatformConstructor: true,
      },
      {
        scenario: 'persist-no-platform-config',
        shouldCallPlatformConstructor: false,
      },
      { scenario: 'persist-with-config', shouldCallPlatformConstructor: true },
    ].forEach(function (scen) {
      describe(scen.scenario, function () {
        let homebridgeServer;
        let tplinkSmarthomePlatformSpy;
        before(function () {
          homebridgeServer = setupHomebridge(scen.scenario);
          tplinkSmarthomePlatformSpy = spyOnPlatformCtor(homebridgeServer);
          homebridgeServer.run();
        });

        after(function () {
          teardownHomebridge(homebridgeServer);
          sinon.restore();
        });

        if (scen.shouldCallPlatformConstructor) {
          it('should call Platform constructor', function () {
            expect(tplinkSmarthomePlatformSpy).to.have.been.calledOnce;
          });
        } else {
          it('should not call Platform constructor', function () {
            expect(tplinkSmarthomePlatformSpy).to.have.not.been.called;
          });
        }
      });
    });
  });
});
