'use strict';

let Accessory;
let Service;
let Characteristic;
let UUIDGen;
let CustomCharacteristic;

class PlugAccessory {
  constructor (platform, config, homebridgeAccessory, plug) {
    this.platform = platform;
    Accessory = platform.api.platformAccessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;
    CustomCharacteristic = require('./homekit.js')(platform.api).CustomCharacteristic;

    this.log = platform.log;
    this.config = config || {};

    this.homebridgeAccessory = homebridgeAccessory;

    if (!this.homebridgeAccessory) {
      this.log.debug('creating new Accessory [%s] OUTLET [%s] [%s]', plug.name, plug.deviceId, UUIDGen.generate(plug.deviceId));
      this.homebridgeAccessory = new Accessory(plug.name, UUIDGen.generate(plug.deviceId), 7 /* Accessory.Categories.OUTLET */);
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.homebridgeAccessory.displayName = plug.name;
    }

    this.outletService = this.homebridgeAccessory.getService(Service.Outlet);
    if (!this.outletService) {
      this.outletService = this.homebridgeAccessory.addService(Service.Outlet, plug.name);
    } else {
      this.outletService.setCharacteristic(Characteristic.Name, plug.name);
    }
    this.outletService.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        this.log.debug('[%s] On get', this.homebridgeAccessory.displayName);
        this.plug.getPowerState().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getSysInfo');
          this.log.error(reason);
          callback(new Error(reason));
        });
      })
      .on('set', (value, callback) => {
        this.log.debug('[%s] On set', this.homebridgeAccessory.displayName);
        this.plug.setPowerState(value).then(() => {
          callback();
        }, (reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setPowerState');
          this.log.error(reason);
          callback(new Error(reason));
        });
      });

    this.outletService.getCharacteristic(Characteristic.OutletInUse)
      .on('get', (callback) => {
        this.log.debug('[%s] OutletInUse get', this.homebridgeAccessory.displayName);
        this.plug.getInUse().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getInUse');
          this.log.error(reason);
          callback(new Error(reason));
        });
      });

    let getOrAddCharacteristic = (service, characteristic) => {
      return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
    };

    if (plug.supportsConsumption && this.config.addCustomCharacteristics) {
      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Volts)
        .on('get', (callback) => {
          this.plug.getConsumption().then((consumption) => {
            callback(null, Math.round(consumption.voltage));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Volts getConsumption');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Amperes)
        .on('get', (callback) => {
          this.plug.getConsumption().then((consumption) => {
            callback(null, Math.round(consumption.current));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Amperes getConsumption');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Watts)
        .on('get', (callback) => {
          this.plug.getConsumption().then((consumption) => {
            callback(null, Math.round(consumption.power));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Watts getConsumption');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.VoltAmperes)
        .on('get', (callback) => {
          this.plug.getConsumption().then((consumption) => {
            callback(null, Math.round(consumption.voltage * consumption.current));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'VoltAmperes getConsumption');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.KilowattHours)
        .on('get', (callback) => {
          this.plug.getConsumption().then((consumption) => {
            callback(null, Math.round(consumption.total));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'KilowattHours getConsumption');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });
    }

    this.infoService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
    if (!this.infoService.getCharacteristic(Characteristic.FirmwareRevision)) {
      this.infoService.addCharacteristic(Characteristic.FirmwareRevision);
    }
    if (!this.infoService.getCharacteristic(Characteristic.HardwareRevision)) {
      this.infoService.addCharacteristic(Characteristic.HardwareRevision);
    }
    this.infoService
      .setCharacteristic(Characteristic.Name, plug.name)
      .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(Characteristic.Model, plug.model)
      .setCharacteristic(Characteristic.SerialNumber, plug.deviceId)
      .setCharacteristic(Characteristic.FirmwareRevision, plug.softwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, plug.hardwareVersion);

    this.homebridgeAccessory.context.deviceId = plug.deviceId;
    this.homebridgeAccessory.on('identify', (paired, callback) => {
      this.log.debug('[%s] identify', this.homebridgeAccessory.displayName);
      this.plug.blink(10, 500).then(() => {
        this.log.debug('[%s] identify done', this.homebridgeAccessory.displayName);
        callback();
      }).catch((reason) => {
        return callback(new Error(reason));
      });
    });

    this.plug = plug;
    this._plug.on('power-on', (plug) => { this.setOn(true); });
    this._plug.on('power-off', (plug) => { this.setOn(false); });
    this._plug.on('in-use', (plug) => { this.setOutletInUse(true); });
    this._plug.on('not-in-use', (plug) => { this.setOutletInUse(false); });
  }

  get plug () { return this._plug; }

  set plug (plug) {
    this._plug = plug;
  }

  setOn (value) {
    this.log.debug('[%s] setOn(%s)', this.homebridgeAccessory.displayName, value);
    this.homebridgeAccessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  setOutletInUse (value) {
    this.log.debug('[%s] setOutletInUse(%s)', this.homebridgeAccessory.displayName, value);
    this.homebridgeAccessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.OutletInUse)
      .updateValue(value);
  }
}

module.exports = PlugAccessory;
