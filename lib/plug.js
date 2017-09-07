'use strict';

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class PlugAccessory {
  constructor (platform, config, homebridgeAccessory, plug) {
    this.platform = platform;
    Accessory = platform.api.platformAccessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;

    this.log = platform.log;
    this.config = config || {};

    this.homebridgeAccessory = homebridgeAccessory;

    if (!this.homebridgeAccessory) {
      this.log.debug('creating new PlatformAccessory [%s] OUTLET [%s]', plug.name, plug.deviceId);
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
        this.plug.getPowerState().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getSysInfo');
          this.log.error(reason);
          callback(new Error(reason));
        });
      })
      .on('set', (value, callback) => {
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
        this.plug.getInUse().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getInUse');
          this.log.error(reason);
          callback(new Error(reason));
        });
      });

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
      .setValue(value);
  }

  setOutletInUse (value) {
    this.log.debug('[%s] setOutletInUse(%s)', this.homebridgeAccessory.displayName, value);
    this.homebridgeAccessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.OutletInUse)
      .setValue(value);
  }
}

module.exports = PlugAccessory;
