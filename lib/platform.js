'use strict';
const Hs100Api = require('hs100-api');
const PlugAccessory = require('./plug');
const BulbAccessory = require('./bulb');

const packageConfig = require('../package.json');
const semver = require('semver');

class Hs100Platform {
  constructor (log, config, api) {
    this.log = log;
    this.config = config || {};
    this.api = api;

    this.log.info(
      '%s v%s, node %s, homebridge v%s',
      packageConfig.name, packageConfig.version, process.version, api.serverVersion
    );
    if (!semver.satisfies(process.version, packageConfig.engines.node)) {
      this.log.warn('Warning: not using recommended node version %s', packageConfig.engines.node);
    }
    this.log.debug('config.json: %j', config);

    this.logLevel = this.config.logLevel;

    this.deviceTypes = this.config.deviceTypes || ['plug'];

    this.homebridgeAccessories = new Map();
    this.deviceAccessories = new Map();

    this.client = new Hs100Api.Client({ deviceTypes: this.deviceTypes, logger: this.log });

    this.client.on('device-new', (device) => {
      this.log.info('New Device Online: [%s] %s [%s]', device.name, device.type, device.deviceId);
      this.addAccessory(device);
    });

    this.client.on('device-online', (device) => {
      this.log.debug('Device Online: [%s] %s [%s]', device.name, device.type, device.deviceId);
      this.addAccessory(device);
    });

    this.client.on('device-offline', (device) => {
      let deviceAccessory = this.deviceAccessories.get(device.deviceId);
      if (deviceAccessory !== undefined) {
        this.log.debug('Device Offline: [%s] %s [%s]', deviceAccessory.homebridgeAccessory.displayName, device.type, device.deviceId);
      }
    });

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      this.client.startDiscovery();
    });
  }
  registerPlatformAccessory (platformAccessory) {
    this.log.debug('registerPlatformAccessory(%s)', platformAccessory.displayName);
    this.api.registerPlatformAccessories('homebridge-hs100', 'Hs100', [platformAccessory]);
  }

  // Function invoked when homebridge tries to restore cached accessory
  configureAccessory (accessory) {
    this.log.info('Configuring cached accessory: [%s]', accessory.displayName);
    this.log.debug(accessory);
    this.homebridgeAccessories.set(accessory.context.deviceId, accessory);
  }

  addAccessory (device) {
    let deviceAccessory = this.deviceAccessories.get(device.deviceId);
    let homebridgeAccessory = this.homebridgeAccessories.get(device.deviceId);

    if (deviceAccessory) {
      deviceAccessory.homebridgeAccessory = homebridgeAccessory;
      if (device.supportsConsumption) {
        this.log.debug('getConsumption [%s]', device.name);
        device.getConsumption();
      }
      return;
    }

    this.log.info('Adding: [%s] %s [%s]', device.name, device.type, device.deviceId);

    switch (device.type) {
      case 'bulb':
        deviceAccessory = new BulbAccessory(this, this.config, homebridgeAccessory, device);
        break;
      case 'plug': // Fall Through
      default:
        deviceAccessory = new PlugAccessory(this, this.config, homebridgeAccessory, device);
    }

    this.deviceAccessories.set(device.deviceId, deviceAccessory);
    this.homebridgeAccessories.set(device.deviceId, deviceAccessory.homebridgeAccessory);
  }

  removeAccessory (homebridgeAccessory) {
    this.log.info('Removing: %s', homebridgeAccessory.displayName);

    this.deviceAccessories.delete(homebridgeAccessory.deviceId);
    this.homebridgeAccessories.delete(homebridgeAccessory.deviceId);
    this.api.unregisterPlatformAccessories('homebridge-hs100', 'Hs100', [homebridgeAccessory]);
  }
}

module.exports = Hs100Platform;
