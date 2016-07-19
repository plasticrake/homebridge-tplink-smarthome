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
    this.plugs = config['plugs'] || [];
    this.accessories = new Map();

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  }

  configureAccessory (accessory) {
    this.accessories.set(accessory.UUID, new Hs100Accessory(this.log, accessory));
  }

  didFinishLaunching () {
    // Cached Accessories
    Promise.all(
      Array.from(this.accessories.values(), (accessory) => {
        return accessory.configure().then(() => {
          return accessory;
        }).catch((reason) => {
          this.log(reason);
        });
      })
    ).then((values) => {
      this.log('Done Configuring Cached Accessories: %j', values.map((e) => {
        return e.accessory.displayName;
      }));
    }).then(() => {
      // Configured Accessories
      const promises = this.plugs.map((plug) => {
        const hs100 = new Hs100Api({host: plug.host, port: plug.port || 9999});

        return hs100.getSysInfo().then((si) => {
          // Check if configured plug is already in the cache
          var acc = this.accessories.get(UUIDGen.generate(si.deviceId));

          if (acc) {
            acc.inConfig = true;
          } else {
            // New plug
            acc = this.addAccessory(plug, si).then((acc) => {
              acc.inConfig = true;
              return acc;
            });
          }

          return acc;
        });
      });

      Promise.all(promises).then((values) => {
        this.log('Done Configuring Accessories: %j', values.map((e) => {
          return e.accessory.displayName;
        }));
      }).catch((reason) => {
        this.log(reason);
      }).then(() => {
        // Removing Cached Accessories not in Config
        this.accessories.forEach((acc) => {
          if (!acc.inConfig) {
            this.removeAccessory(acc);
          }
        });
      });
    }).catch((reason) => {
      this.log(reason);
    });
  }

  addAccessory (config, sysInfo) {
    const name = sysInfo.alias || config.host;
    this.log('Adding: %s', name);

    const platformAccessory = new Accessory(name, UUIDGen.generate(sysInfo.deviceId), 7 /* Accessory.Categories.OUTLET */);
    platformAccessory.addService(Service.Outlet, name);

    const infoService = platformAccessory.getService(Service.AccessoryInformation);
    infoService.addCharacteristic(Characteristic.FirmwareRevision);
    infoService.addCharacteristic(Characteristic.HardwareRevision);

    platformAccessory.context.deviceId = sysInfo.deviceId;
    platformAccessory.context.host = config.host;
    platformAccessory.context.port = config.port || 9999;

    const accessory = new Hs100Accessory(this.log, platformAccessory);

    return accessory.configure(sysInfo).then(() => {
      this.accessories.set(platformAccessory.UUID, accessory);
      this.api.registerPlatformAccessories('homebridge-hs100', 'Hs100', [platformAccessory]);
      return accessory;
    }).catch((reason) => {
      this.log(reason);
    });
  }

  removeAccessory (accessory) {
    this.log('Removing: %s', accessory.accessory.displayName);

    this.accessories.delete(accessory.accessory.UUID);
    this.api.unregisterPlatformAccessories('homebridge-hs100', 'Hs100', [accessory.accessory]);
  }

}

class Hs100Accessory {
  constructor (log, accessory, hs100api) {
    this.log = log;

    this.accessory = accessory;
    this.hs100api = new Hs100Api({host: accessory.context.host, port: accessory.context.port});
  }

  identify (callback) {
    // TODO
    callback();
  }

  configure (sysInfo) {
    this.log('Configuring: %s', this.accessory.displayName);

    sysInfo = sysInfo ? Promise.resolve(sysInfo) : this.hs100api.getSysInfo();

    return sysInfo.then((si) => {
      const pa = this.accessory;

      this.refresh(sysInfo);

      const outletService = pa.getService(Service.Outlet);
      outletService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          this.hs100api.getSysInfo().then((si) => {
            this.refresh(si);
            callback(null, si.relay_state === 1);
          }).catch((reason) => {
            this.log(reason);
          });
        })
        .on('set', (value, callback) => {
          this.hs100api.setPowerState(value).then(() => {
            callback();
          }, (reason) => {
            this.log(reason);
          });
        });

      outletService.getCharacteristic(Characteristic.OutletInUse)
        .on('get', (callback) => {
          this.hs100api.getSysInfo().then((si) => {
            this.refresh(si);
            callback(null, si.relay_state === 1);
          }).catch((reason) => {
            this.log(reason);
          });
        });
    }).catch((reason) => {
      this.log(reason);
    });
  }

  refresh (sysInfo) {
    sysInfo = sysInfo ? Promise.resolve(sysInfo) : this.hs100api.getSysInfo();

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
