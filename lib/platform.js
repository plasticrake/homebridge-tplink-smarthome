'use strict';
const Hs100Api = require('hs100-api');
const PlugAccessory = require('./plug');

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class Hs100Platform {
  constructor (log, config, api) {
    this.log = log;
    this.config = config || {};
    this.api = api;

    this.debug = !!(this.config.debug);

    this.accessories = new Map();

    this.client = new Hs100Api.Client({ deviceTypes: this.config.deviceTypes, debug: this.debug });

    this.client.on('plug-offline', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory !== undefined) {
        if (accessory instanceof PlugAccessory) {
          this.log.debug('Offline: %s [%s]', accessory.accessory.displayName, accessory.deviceId);
        }
      }
    });

    this.client.on('plug-online', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        if (accessory instanceof PlugAccessory) {
          accessory.plug = plug;
          this.log.debug('Online: %s [%s]', accessory.accessory.displayName, plug.deviceId);
        }
      }
    });

    this.client.on('plug-new', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        this.log.info('New Plug Online: %s [%s]', accessory.displayName, plug.deviceId);
        var hs100Acc = new PlugAccessory(this, this.config, accessory, this.client, plug);
        this.accessories.set(plug.deviceId, hs100Acc);
        hs100Acc.configure(plug);
      }
    });

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  }

  static setHomebridge (homebridge) {
    Hs100Platform.homebridge = homebridge;
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
  }

  get homebridge () {
    return Hs100Platform.homebridge;
  }

  // Function invoked when homebridge tries to restore cached accessory
  configureAccessory (accessory) {
    this.accessories.set(accessory.context.deviceId, accessory);
  }

  didFinishLaunching () {
    this.client.startDiscovery();
  }

  addAccessory (plug) {
    const name = plug.name;
    this.log.info('Adding: %s', name);

    const platformAccessory = new Accessory(name, UUIDGen.generate(plug.deviceId), 7 /* Accessory.Categories.OUTLET */);
    platformAccessory.addService(Service.Outlet, name);

    const infoService = platformAccessory.getService(Service.AccessoryInformation);
    if (!infoService.getCharacteristic(Characteristic.FirmwareRevision)) {
      infoService.addCharacteristic(Characteristic.FirmwareRevision);
    }
    if (!infoService.getCharacteristic(Characteristic.HardwareRevision)) {
      infoService.addCharacteristic(Characteristic.HardwareRevision);
    }

    platformAccessory.context.deviceId = plug.deviceId;

    const accessory = new PlugAccessory(this, this.config, platformAccessory, this.client, plug);

    return accessory.configure(plug).then(() => {
      this.accessories.set(plug.deviceId, accessory);
      this.api.registerPlatformAccessories('homebridge-hs100', 'Hs100', [platformAccessory]);
      return accessory;
    }).catch((reason) => {
      this.log.error(reason);
    });
  }

  removeAccessory (accessory) {
    this.log.info('Removing: %s', accessory.accessory.displayName);

    this.accessories.delete(accessory.accessory.deviceId);
    this.api.unregisterPlatformAccessories('homebridge-hs100', 'Hs100', [accessory.accessory]);
  }
}

module.exports = Hs100Platform;
