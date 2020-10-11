const path = require('path');
const fs = require('fs-extra');
const { expect, ...chai } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const hap = require('hap-nodejs');
const { Server } = require('homebridge/lib/server');
// const { Plugin } = require('homebridge/lib/plugin');
const { User } = require('homebridge/lib/user');

const { PLATFORM_NAME, PLUGIN_NAME } = require('../../src/settings');
// const TplinkSmarthomePlatform = require('../../src/platform');

chai.use(sinonChai);

// Storage path can only be set before being accessed
const tempDir = path.resolve(__dirname, 'fixtures', 'temp');
User.setStoragePath(tempDir);
hap.init(User.persistPath());

const setupHomebridge = function setupHomebridge(scenario) {
  // Plugin.addPluginPath(path.resolve(__dirname, '..', '..'));

  const scenarioDir = path.resolve(
    __dirname,
    'fixtures',
    'homebridge',
    scenario
  );

  fs.emptyDirSync(tempDir);
  fs.copySync(scenarioDir, tempDir);

  return new Server({
    hideQRCode: true,
    customPluginPath: path.resolve(__dirname, '..', '..'),
  });
};

const spyOnPlatformCtor = function spyOnPlatformCtor(homebridgeServer) {
  const platformIdentifier = `${PLUGIN_NAME}.${PLATFORM_NAME}`;
  const plugin = homebridgeServer.pluginManager.getPluginForPlatform(
    platformIdentifier
  );

  const platformCtor = plugin.getPlatformConstructor(platformIdentifier);

  const tplinkSmarthomePlatformSpy = sinon.spy(platformCtor);

  // homebridgeServer.api.registerPlatform(PLATFORM_NAME, TplinkSmarthomePlatform);

  // homebridgeServer.api.platforms[
  //   'homebridge-tplink-smarthome.TplinkSmarthome'
  // ] = tplinkSmarthomePlatformSpy;

  return tplinkSmarthomePlatformSpy;
};

const scenarios = [
  { name: 'fresh-no-config', shouldCallPlatformConstructor: false },
  { name: 'fresh-with-config', shouldCallPlatformConstructor: true },
  {
    name: 'persist-no-accessories-with-config',
    shouldCallPlatformConstructor: true,
  },
  {
    name: 'persist-no-platform-config',
    shouldCallPlatformConstructor: false,
  },
  { name: 'persist-with-config', shouldCallPlatformConstructor: true },
];

describe.skip('homebridge', function () {
  scenarios.forEach(function (scenario) {
    describe(scenario.name, function () {
      let homebridgeServer;
      let tplinkSmarthomePlatformSpy;
      let tplinkSmarthomePlugin;

      beforeEach(async function () {
        this.timeout(5000);
        homebridgeServer = setupHomebridge(scenario.name);
        await homebridgeServer.start();
        tplinkSmarthomePlatformSpy = spyOnPlatformCtor(homebridgeServer);
        tplinkSmarthomePlugin = homebridgeServer.pluginManager.getPluginForPlatform(
          PLATFORM_NAME
        );
      });

      afterEach(function () {
        homebridgeServer.teardown();
        sinon.restore();
      });

      it('plugin', function () {
        expect(tplinkSmarthomePlugin).to.have.property(
          'pluginName',
          PLUGIN_NAME
        );
      });

      describe('startup', function () {
        if (scenario.shouldCallPlatformConstructor) {
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
