'use strict';

const semver = require('semver');
const castArray = require('lodash.castarray');

const { Client } = require('tplink-smarthome-api');
const PlugAccessory = require('./plug');
const BulbAccessory = require('./bulb');
const packageConfig = require('../package.json');

const configSetup = function () {
  const c = this.config;
  c.addCustomCharacteristics = (c.addCustomCharacteristics == null ? true : c.addCustomCharacteristics);
  c.deviceTypes = (c.deviceTypes == null ? [] : castArray(c.deviceTypes));
  c.switchModels = (c.switchModels == null ? ['HS200'] : c.switchModels); // null = default
  c.switchModels = (c.switchModels === '' ? [] : castArray(c.switchModels)); // '' = [] (no match)

  c.discoveryOptions = c.discoveryOptions || {};
  let dis = c.discoveryOptions;
  dis.discoveryInterval = dis.discoveryInterval || c.pollingInterval * 1000 || 10000;
  dis.deviceTypes = dis.deviceTypes || c.deviceTypes;
  dis.deviceOptions = c.deviceOptions || {};
  dis.macAddresses = c.macAddresses || [];
  if (Array.isArray(c.devices)) {
    dis.devices = c.devices;
  }

  let dev = dis.deviceOptions;
  dev.timeout = dev.timeout || c.timeout * 1000 || 5000;
  dev.inUseThreshold = dev.inUseThreshold || c.inUseThreshold;
};

class TplinkSmarthomePlatform {
  constructor (log, config, api) {
    this.log = log;
    this.config = config || {};
    this.api = api;

    this.log.info(
      '%s v%s, node %s, homebridge v%s',
      packageConfig.name, packageConfig.version, process.version, api.serverVersion
    );
    if (!semver.satisfies(process.version, packageConfig.engines.node)) {
      throw new Error('Error: not using minimum node version %s', packageConfig.engines.node);
    }
    this.log.debug('config.json: %j', config);

    configSetup.call(this);
    this.log.debug('config: %j', this.config);

    this.homebridgeAccessories = new Map();
    this.deviceAccessories = new Map();

    const TplinkSmarthomeLog = Object.assign({}, this.log, {prefix: (this.log.prefix || 'TplinkSmarthome') + '.' + 'API'});

    this.client = new Client({ logger: TplinkSmarthomeLog, timeout: this.config.timeout });

    this.client.on('device-new', (device) => {
      this.log.info('New Device Online: [%s] %s [%s]', device.alias, device.deviceType, device.deviceId, device.host, device.port);
      this.addAccessory(device);
    });

    this.client.on('device-online', (device) => {
      this.log.debug('Device Online: [%s] %s [%s]', device.alias, device.deviceType, device.deviceId, device.host, device.port);
      this.addAccessory(device);
    });

    this.client.on('device-offline', (device) => {
      let deviceAccessory = this.deviceAccessories.get(device.deviceId);
      if (deviceAccessory !== undefined) {
        this.log.debug('Device Offline: [%s] %s [%s]', deviceAccessory.homebridgeAccessory.displayName, device.deviceType, device.deviceId, device.host, device.port);
      }
    });

    this.api.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      this.client.startDiscovery(this.config.discoveryOptions);
    });
  }

  registerPlatformAccessory (platformAccessory) {
    this.log.debug('registerPlatformAccessory(%s)', platformAccessory.displayName);
    this.api.registerPlatformAccessories('homebridge-tplink-smarthome', 'TplinkSmarthome', [platformAccessory]);
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
      if (device.deviceType === 'plug' && device.supportsEmeter) {
        this.log.debug('getEmeterRealtime [%s]', device.alias);
        device.emeter.getRealtime().catch((reason) => {
          this.log.error('[%s] %s', device.alias, 'emeter.getRealtime()');
          this.log.error(reason);
        });
      }
      return;
    }

    this.log.info('Adding: [%s] %s [%s]', device.alias, device.deviceType, device.deviceId);

    switch (device.deviceType) {
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
    this.api.unregisterPlatformAccessories('homebridge-tplink-smarthome', 'TplinkSmarthome', [homebridgeAccessory]);
  }
}

module.exports = TplinkSmarthomePlatform;
