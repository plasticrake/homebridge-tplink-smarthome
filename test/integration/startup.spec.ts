import fs from 'fs-extra';
import { HAPStorage } from 'hap-nodejs';
import { DynamicPlatformPlugin, PlatformPluginConstructor } from 'homebridge';
import { PluginManager } from 'homebridge/lib/pluginManager';
import { Server } from 'homebridge/lib/server';
import { User } from 'homebridge/lib/user';
import path from 'path';

import { PLATFORM_NAME, PLUGIN_NAME } from '../../src/settings';

const platformIdentifier = `${PLUGIN_NAME}.${PLATFORM_NAME}`;

function getPlugin(homebridgeServer: Server) {
  // @ts-expect-error: Accessing private
  const { pluginManager }: { pluginManager: PluginManager } = homebridgeServer;
  const plugin = pluginManager.getPluginForPlatform(platformIdentifier);

  return plugin;
}

describe('homebridge', function () {
  const homebridgeStorageFolder = path.resolve(__dirname, 'fixtures', 'temp');
  const pluginPath = path.resolve(__dirname, '..', '..');

  function setupHomebridge(scenarioName: string) {
    const scenarioDir = path.resolve(
      __dirname,
      'fixtures',
      'homebridge',
      scenarioName
    );

    fs.emptyDirSync(homebridgeStorageFolder);
    fs.copySync(scenarioDir, homebridgeStorageFolder);

    return new Server({
      customPluginPath: pluginPath,
      customStoragePath: homebridgeStorageFolder,
      hideQRCode: true,
    });
  }

  beforeAll(async function () {
    // Storage path can only be set before being accessed
    User.setStoragePath(homebridgeStorageFolder);
    HAPStorage.setCustomStoragePath(User.persistPath());
  });

  [
    { name: 'fresh-no-config', shouldInitPlatform: false },
    { name: 'fresh-with-config', shouldInitPlatform: true },
    {
      name: 'persist-no-accessories-with-config',
      shouldInitPlatform: true,
    },
    {
      name: 'persist-no-platform-config',
      shouldInitPlatform: false,
    },
    { name: 'persist-with-config', shouldInitPlatform: true },
  ].forEach(function (scenario) {
    describe(scenario.name, function () {
      let homebridgeServer: Server;
      let tplinkSmarthomePlugin: ReturnType<typeof getPlugin>;
      let tplinkSmarthomePlatform: PlatformPluginConstructor | undefined;
      let activeDynamicPlatform: DynamicPlatformPlugin | undefined;

      beforeEach(async function () {
        homebridgeServer = setupHomebridge(scenario.name);
        await homebridgeServer.start();

        tplinkSmarthomePlugin = getPlugin(homebridgeServer);
        tplinkSmarthomePlatform =
          tplinkSmarthomePlugin.getPlatformConstructor(PLATFORM_NAME);
        activeDynamicPlatform =
          tplinkSmarthomePlugin.getActiveDynamicPlatform(PLATFORM_NAME);
      }, 5000);

      afterEach(function () {
        homebridgeServer.teardown();
        jest.resetAllMocks();
      });

      it('plugin was loaded', function () {
        expect(tplinkSmarthomePlugin).toHaveProperty('pluginName', PLUGIN_NAME);
        expect(tplinkSmarthomePlugin).toHaveProperty('disabled', false);
        expect(tplinkSmarthomePlugin).toHaveProperty('pluginPath', pluginPath);
        expect(tplinkSmarthomePlatform).toBeInstanceOf(Function);
      });

      describe('startup', function () {
        if (scenario.shouldInitPlatform) {
          it('should load Platform', function () {
            expect(activeDynamicPlatform).toBeInstanceOf(
              tplinkSmarthomePlatform
            );
          });
        } else {
          it('should not load Platform', function () {
            expect(activeDynamicPlatform).toBeUndefined();
          });
        }
      });
    });
  });
});
