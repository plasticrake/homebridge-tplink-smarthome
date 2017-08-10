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
    this.accessories = new Map();

    this.client = new Hs100Api.Client();

    this.client.on('plug-offline', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory !== undefined) {
        if (accessory instanceof Hs100Accessory) {
          this.log('Offline: %s [%s]', accessory.accessory.displayName, accessory.deviceId);
          accessory.accessory.updateReachability(false);
        }
      }
    });

    this.client.on('plug-online', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        if (accessory instanceof Hs100Accessory) {
          this.log('Online: %s [%s]', accessory.accessory.displayName, plug.deviceId);
          accessory.accessory.updateReachability(true);
        }
      }
    });

    this.client.on('plug-new', (plug) => {
      var accessory = this.accessories.get(plug.deviceId);
      if (accessory === undefined) {
        this.addAccessory(plug);
      } else {
        this.log('New Plug Online: %s [%s]', accessory.displayName, plug.deviceId);
        accessory.context.host = plug.host;
        accessory.context.port = plug.port;
        var hs100Acc = new Hs100Accessory(this.log, accessory, this.client);
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
    platformAccessory.context.host = plug.host;
    platformAccessory.context.port = plug.port || 9999;

    const accessory = new Hs100Accessory(this.log, platformAccessory, this.client);

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
  constructor (log, accessory, client) {
    this.log = log;

    this.accessory = accessory;
    this.client = client;
    this.plug = client.getPlug({host: accessory.context.host, port: accessory.context.port});
    this.deviceId = accessory.context.deviceId;
  // this.hs100api = hs100api ; // || new Hs100Api({host: accessory.context.host, port: accessory.context.port})
  }

  identify (callback) {
    // TODO
    callback();
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
            // On HS110 model we'll check the current power consumption to determinate the state
            if (si.model.toLowerCase().indexOf('hs110')) {
              this.plug.getConsumption().then((consumption) => {
                callback(null, consumption.get_realtime.power > 0);
              });
            // On HS100 we can just use relay state
            } else {
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
      this.accessory.updateReachability(true);

      const name = si.alias || this.accessory.context.host;
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
