'use strict';

const Hs100Api = require('hs100-api');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-hs100', 'Hs100', Hs100Platform, true);
};

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
        if (accessory instanceof Hs100Accessory) {
          if (this.debug) { this.log('Offline: %s [%s]', accessory.accessory.displayName, accessory.deviceId); }
        }
      }
    });

    this.client.on('plug-online', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        if (accessory instanceof Hs100Accessory) {
          accessory.plug = plug;
          if (this.debug) { this.log('Online: %s [%s]', accessory.accessory.displayName, plug.deviceId); }
        }
      }
    });

    this.client.on('plug-new', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        this.log('New Plug Online: %s [%s]', accessory.displayName, plug.deviceId);
        var hs100Acc = new Hs100Accessory(this.log, this.config, accessory, this.client, plug);
        this.accessories.set(plug.deviceId, hs100Acc);
        hs100Acc.configure(plug);
      }
    });

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
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
    this.log('Adding: %s', name);

    const platformAccessory = new Accessory(name, UUIDGen.generate(plug.deviceId), 7 /* Accessory.Categories.OUTLET */);
    platformAccessory.addService(Service.Outlet, name);

    const infoService = platformAccessory.getService(Service.AccessoryInformation);
    infoService.addCharacteristic(Characteristic.FirmwareRevision);
    infoService.addCharacteristic(Characteristic.HardwareRevision);

    platformAccessory.context.deviceId = plug.deviceId;

    const accessory = new Hs100Accessory(this.log, this.config, platformAccessory, this.client, plug);

    return accessory.configure(plug).then(() => {
      this.accessories.set(plug.deviceId, accessory);
      this.api.registerPlatformAccessories('homebridge-hs100', 'Hs100', [platformAccessory]);
      return accessory;
    }).catch((reason) => {
      this.log(reason);
    });
  }

  removeAccessory (accessory) {
    this.log('Removing: %s', accessory.accessory.displayName);

    this.accessories.delete(accessory.accessory.deviceId);
    this.api.unregisterPlatformAccessories('homebridge-hs100', 'Hs100', [accessory.accessory]);
  }
}

class Hs100Accessory {
  constructor (log, config, accessory, client, plug) {
    this.log = log;

    this.accessory = accessory;
    this.client = client;
    this.config = config;

    this.debug = !!(this.config.debug);

    this.deviceId = accessory.context.deviceId;

    this.plug = plug;
  }

  get plug () { return this._plug; }

  set plug (plug) {
    this._plug = plug;
    this._plug.on('power-on', (plug) => { this.setOn(true); });
    this._plug.on('power-off', (plug) => { this.setOn(false); });
    this._plug.on('in-use', (plug) => { this.setOutletInUse(true); });
    this._plug.on('not-in-use', (plug) => { this.setOutletInUse(false); });
  }

  identify (callback) {
    // TODO
    callback();
  }

  setOn (value) {
    if (this.debug) { this.log('DEBUG: setOn(%s)', value); }
    const outletService = this.accessory.getService(Service.Outlet);
    const characteristic = outletService.getCharacteristic(Characteristic.On);
    characteristic.setValue(value);
  }

  setOutletInUse (value) {
    if (this.debug) { this.log('DEBUG: setOutletInUse(%s)', value); }
    const outletService = this.accessory.getService(Service.Outlet);
    const characteristic = outletService.getCharacteristic(Characteristic.OutletInUse);
    characteristic.setValue(value);
  }

  configure (plug) {
    this.log('Configuring: %s', this.accessory.displayName);

    let plugInfo = plug ? Promise.resolve(plug.getInfo) : this.plug.getInfo();

    return plugInfo.then((info) => {
      const pa = this.accessory;

      this.refresh(info.sysInfo);

      const outletService = pa.getService(Service.Outlet);
      outletService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          this.plug.getSysInfo().then((si) => {
            this.refresh(si);
            callback(null, si.relay_state === 1);
          }).catch((reason) => {
            this.log(reason);
          });
        })
        .on('set', (value, callback) => {
          this.plug.setPowerState(value).then(() => {
            callback();
          }, (reason) => {
            this.log(reason);
          });
        });

      outletService.getCharacteristic(Characteristic.OutletInUse)
        .on('get', (callback) => {
          this.plug.getSysInfo().then((si) => {
            this.refresh(si);
            if (plug.supportsConsumption) {
              this.plug.getConsumption().then((consumption) => {
                callback(null, consumption.get_realtime.power > 0);
              });
            } else {
              // On plugs that don't support consumption we use relay state
              callback(null, si.relay_state === 1);
            }
          }).catch((reason) => {
            this.log(reason);
          });
        });
    }).catch((reason) => {
      this.log(reason);
    });
  }

  refresh (sysInfo) {
    sysInfo = sysInfo ? Promise.resolve(sysInfo) : this.plug.getSysInfo();

    return sysInfo.then((si) => {
      const name = si.alias;
      this.accessory.displayName = name;

      const outletService = this.accessory.getService(Service.Outlet);
      outletService.setCharacteristic(Characteristic.Name, name);

      const infoService = this.accessory.getService(Service.AccessoryInformation);
      infoService
        .setCharacteristic(Characteristic.Name, name)
        .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
        .setCharacteristic(Characteristic.Model, si.model)
        .setCharacteristic(Characteristic.SerialNumber, si.deviceId)
        .setCharacteristic(Characteristic.FirmwareRevision, si.sw_ver)
        .setCharacteristic(Characteristic.HardwareRevision, si.hw_ver);

      this.accessory.context.lastRefreshed = new Date();
      return this;
    }).catch((reason) => {
      this.log(reason);
    });
  }
}
