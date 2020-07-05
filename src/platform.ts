/**
 * @typedef {import('tplink-smarthome-api').Client} Client
 */
/**
 * @typedef {import('tplink-smarthome-api').Device} Device
 */
/**
 * @typedef {import('homebridge/lib/platformAccessory')} PlatformAccessory
 */

const semver = require('semver');
const castArray = require('lodash.castarray');

/**
 * @type {Client}
 */
const { Client } = require('tplink-smarthome-api');
const Characteristics = require('./characteristics');
const { TplinkAccessory } = require('./tplink-accessory');
const { lookup } = require('./utils');

const packageConfig = require('../package.json');

/**
 * @private
 */
const configSetup = function configSetup() {
  const c = this.config;
  c.addCustomCharacteristics =
    c.addCustomCharacteristics == null ? true : c.addCustomCharacteristics;
  c.deviceTypes = c.deviceTypes == null ? [] : castArray(c.deviceTypes);
  c.switchModels = c.switchModels == null ? ['HS200', 'HS210'] : c.switchModels; // null = default
  c.switchModels = c.switchModels === '' ? [] : castArray(c.switchModels); // '' = [] (no match)

  c.discoveryOptions = c.discoveryOptions || {};
  const dis = c.discoveryOptions;
  dis.broadcast = dis.broadcast || c.broadcast;
  dis.discoveryInterval =
    dis.discoveryInterval || c.pollingInterval * 1000 || 10000;
  dis.deviceTypes = dis.deviceTypes || c.deviceTypes;
  dis.deviceOptions = dis.deviceOptions || c.deviceOptions || {};
  dis.macAddresses = dis.macAddresses || c.macAddresses || [];
  dis.excludeMacAddresses =
    dis.excludeMacAddresses || c.excludeMacAddresses || [];
  if (Array.isArray(c.devices)) {
    dis.devices = c.devices;
  }

  c.defaultSendOptions = c.defaultSendOptions || {};
  const dso = c.defaultSendOptions;
  dso.timeout = dso.timeout || c.timeout * 1000 || 15000;

  const dev = dis.deviceOptions;
  dev.defaultSendOptions = dev.defaultSendOptions || { ...dso };
  dev.inUseThreshold = dev.inUseThreshold || c.inUseThreshold;
};

/**
 *
 * @private
 * @param {TplinkSmarthomePlatform} platform
 * @param {PlatformAccessory} accessory
 * @param {Device} tplinkDevice
 * @returns
 */
const createTplinkAccessory = function createTplinkAccessory(
  platform,
  accessory,
  tplinkDevice
) {
  const { config } = platform;
  const { Categories } = platform.homebridge.hap.Accessory;
  const { Service } = platform.homebridge.hap;

  const [category, services] = (() => {
    if (tplinkDevice.deviceType === 'bulb') {
      return [Categories.LIGHTBULB, [Service.Lightbulb]];
    }
    // plug
    if (
      config.switchModels &&
      config.switchModels.findIndex((m) => tplinkDevice.model.includes(m)) !==
        -1
    ) {
      return [Categories.SWITCH, [Service.Switch]];
    }
    if (tplinkDevice.supportsDimmer) {
      return [Categories.LIGHTBULB, [Service.Lightbulb]];
    }
    return [Categories.OUTLET, [Service.Outlet]];
  })();

  return new TplinkAccessory(
    platform,
    platform.config,
    accessory,
    tplinkDevice,
    category,
    services
  );
};

class TplinkSmarthomePlatform {
  constructor(log, config, homebridge) {
    this.log = log;
    this.config = config || {};
    this.homebridge = homebridge;

    this.customCharacteristics = Characteristics(homebridge.hap.Characteristic);

    this.log.info(
      '%s v%s, node %s, homebridge v%s',
      packageConfig.name,
      packageConfig.version,
      process.version,
      homebridge.serverVersion
    );
    if (!semver.satisfies(process.version, packageConfig.engines.node)) {
      this.log.error(
        'Error: not using minimum node version %s',
        packageConfig.engines.node
      );
    }
    this.log.debug('config.json: %j', config);

    configSetup.call(this);
    this.log.debug('config: %j', this.config);

    /**
     * @member {Map<string, PlatformAccessory>}
     * @private
     */
    this.homebridgeAccessories = new Map();
    /**
     * @member {Map<string, TplinkAccessory>}
     * @private
     */
    this.deviceAccessories = new Map();

    const TplinkSmarthomeLog = {
      ...this.log,
      prefix: `${this.log.prefix || 'TplinkSmarthome'}.API`,
    };

    /**
     * @member {Client}
     * @private
     */
    this.client = new Client({
      logger: TplinkSmarthomeLog,
      defaultSendOptions: this.config.defaultSendOptions,
    });

    this.client.on('device-new', (device) => {
      this.log.info(
        'New Device Online: [%s] %s [%s]',
        device.alias,
        device.deviceType,
        device.id,
        device.host,
        device.port
      );
      this.addAccessory(device);
    });

    this.client.on('device-online', (device) => {
      this.log.debug(
        'Device Online: [%s] %s [%s]',
        device.alias,
        device.deviceType,
        device.id,
        device.host,
        device.port
      );
      this.addAccessory(device);
    });

    this.client.on('device-offline', (device) => {
      const deviceAccessory = this.deviceAccessories.get(device.id);
      if (deviceAccessory !== undefined) {
        this.log.debug(
          'Device Offline: [%s] %s [%s]',
          deviceAccessory.homebridgeAccessory.displayName,
          device.deviceType,
          device.id,
          device.host,
          device.port
        );
      }
    });

    this.homebridge.on('didFinishLaunching', () => {
      this.log.debug('didFinishLaunching');
      this.client.startDiscovery({
        ...this.config.discoveryOptions,
        filterCallback: (si) => {
          return si.deviceId != null && si.deviceId.length > 0;
        },
      });
    });

    this.homebridge.on('shutdown', () => {
      this.log.debug('shutdown');
      this.client.stopDiscovery();
    });

    this.getCategoryName = lookup.bind(
      homebridge.hap.Accessory.Categories,
      null
    );
    this.getServiceName = lookup.bind(
      homebridge.hap.Service,
      (thisKeyValue, value) => thisKeyValue.UUID === value.UUID
    );

    this.getCharacteristicName = (characteristic) => {
      return (
        characteristic.name ||
        characteristic.displayName ||
        lookup.bind(
          homebridge.hap.Characteristic,
          (thisKeyValue, value) => thisKeyValue.UUID === value.UUID
        )(characteristic)
      );
    };
  }

  /**
   * Registers a Homebridge PlatformAccessory.
   *
   * Calls {@link external:homebridge.API#registerPlatformAccessories}
   *
   * @private
   * @param {PlatformAccessory} platformAccessory
   * @returns {void}
   * @memberof TplinkSmarthomePlatform
   */
  registerPlatformAccessory(platformAccessory) {
    this.log.debug(
      'registerPlatformAccessory(%s)',
      platformAccessory.displayName
    );
    this.homebridge.registerPlatformAccessories(
      'homebridge-tplink-smarthome',
      'TplinkSmarthome',
      [platformAccessory]
    );
  }

  /**
   * Function invoked when homebridge tries to restore cached accessory
   *
   * @param {PlatformAccessory} accessory
   * @returns {void}
   * @memberof TplinkSmarthomePlatform
   */
  configureAccessory(accessory) {
    this.log.info(
      'Configuring cached accessory: [%s] %s %s',
      accessory.displayName,
      accessory.context ? accessory.context.deviceId : null,
      accessory.UUID
    );
    this.log.debug('%j', accessory);
    this.homebridgeAccessories.set(accessory.UUID, accessory);
  }

  /**
   * Adds a new or existing real device.
   *
   * @private
   * @param {Device} device
   * @returns {void}
   * @memberof TplinkSmarthomePlatform
   */
  addAccessory(device) {
    // TODO: refactor this function
    const deviceId = device.id;

    if (deviceId == null || deviceId.length === 0) {
      this.log.error('Missing deviceId: %s', device.host);
      return;
    }

    let deviceAccessory = this.deviceAccessories.get(deviceId);

    if (deviceAccessory) {
      if (device.deviceType === 'plug' && device.supportsEmeter) {
        this.log.debug('getEmeterRealtime [%s]', device.alias);
        device.emeter.getRealtime().catch((reason) => {
          this.log.error('[%s] %s', device.alias, 'emeter.getRealtime()');
          this.log.error(reason);
        });
      }
      return;
    }

    this.log.info(
      'Adding: [%s] %s [%s]',
      device.alias,
      device.deviceType,
      deviceId
    );

    const uuid = this.homebridge.hap.uuid.generate(deviceId);
    const homebridgeAccessory = this.homebridgeAccessories.get(uuid);

    deviceAccessory = createTplinkAccessory(this, homebridgeAccessory, device);

    this.deviceAccessories.set(deviceId, deviceAccessory);
    this.homebridgeAccessories.set(uuid, deviceAccessory.homebridgeAccessory);
  }

  /**
   * Removes an accessory and unregisters it from Homebridge
   *
   * @private
   * @param {PlatformAccessory} homebridgeAccessory
   * @returns {void}
   * @memberof TplinkSmarthomePlatform
   */
  removeAccessory(homebridgeAccessory) {
    this.log.info('Removing: %s', homebridgeAccessory.displayName);

    this.deviceAccessories.delete(homebridgeAccessory.context.deviceId);
    this.homebridgeAccessories.delete(homebridgeAccessory.UUID);
    this.homebridge.unregisterPlatformAccessories(
      'homebridge-tplink-smarthome',
      'TplinkSmarthome',
      [homebridgeAccessory]
    );
  }
}

module.exports = TplinkSmarthomePlatform;
