'use strict';

const semver = require('semver');
const castArray = require('lodash.castarray');

const Hs100Api = require('hs100-api');
const PlugAccessory = require('./plug');
const BulbAccessory = require('./bulb');
const packageConfig = require('../package.json');

const configSetup = function () {
  const c = this.config;
  c.deviceTypes = (c.deviceTypes == null ? ['plug'] : castArray(c.deviceTypes));
  c.addCustomCharacteristics = (c.addCustomCharacteristics == null ? true : c.addCustomCharacteristics);
  c.switchModels = (c.switchModels == null ? ['HS200'] : c.switchModels); // null = default
  c.switchModels = (c.switchModels === '' ? [] : castArray(c.switchModels)); // '' = [] (no match)

  c.discoveryOptions = c.discoveryOptions || {};
  let dis = c.discoveryOptions;
  dis.discoveryInterval = dis.discoveryInterval || c.pollingInterval * 1000 || 10000;
  dis.deviceTypes = dis.deviceTypes || c.deviceTypes;
  dis.deviceOptions = c.deviceOptions || {};

  let dev = dis.deviceOptions;
  dev.timeout = dev.timeout || c.timeout * 1000 || 5000;
  dev.inUseThreshold = dev.inUseThreshold || c.inUseThreshold;
  dev.memoize = dev.memoize || c.cacheTtl * 1000 || null;
};

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

    configSetup.call(this);
    this.log.debug('config: %j', this.config);

    this.homebridgeAccessories = new Map();
    this.deviceAccessories = new Map();

    const Hs100Log = Object.assign({}, this.log, {prefix: (this.log.prefix || 'Hs100') + '.' + 'API'});

    this.client = new Hs100Api.Client({ logger: Hs100Log, timeout: this.config.timeout });

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
      this.client.startDiscovery(this.config.discoveryOptions);
    });
  }

  registerPlatformAccessory (platformAccessory) {
    this.log.debug('registerPlatformAccessory(%s)', platformAccessory.displayName);
    this.api.registerPlatformAccessories('homebridge-hs100', 'Hs100', [platformAccessory]);
  }

  // Function invoked when homebridge tries to restore cached accessory
  configureAccessory (accessory) {
    this.log.info('Configuring cached accessory: [%s] %s %s', accessory.displayName, accessory.context.deviceId, accessory.UUID);
    this.log.debug('%j', accessory);
    this.homebridgeAccessories.set(accessory.context.deviceId, accessory);
  }

  addAccessory (device) {
    let deviceAccessory = this.deviceAccessories.get(device.deviceId);
    let homebridgeAccessory = this.homebridgeAccessories.get(device.deviceId);

    if (deviceAccessory) {
      deviceAccessory.homebridgeAccessory = homebridgeAccessory;
      if (device.supportsConsumption) {
        this.log.debug('getConsumption [%s]', device.name);
        device.getConsumption().catch((reason) => {
          this.log.error('[%s] %s', device.name, 'getConsumption');
          this.log.error(reason);
        });
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
