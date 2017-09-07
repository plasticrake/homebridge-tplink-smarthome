'use strict';

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class BulbAccessory {
  constructor (platform, config, homebridgeAccessory, bulb) {
    this.platform = platform;
    Accessory = platform.api.platformAccessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;

    this.log = platform.log;
    this.config = config || {};

    this.homebridgeAccessory = homebridgeAccessory;

    if (!this.homebridgeAccessory) {
      this.log.debug('creating new PlatformAccessory [%s] LIGHTBULB [%s]', bulb.name, bulb.deviceId);
      this.homebridgeAccessory = new Accessory(bulb.name, UUIDGen.generate(bulb.deviceId), 5 /* Accessory.Categories.LIGHTBULB */);
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.homebridgeAccessory.displayName = bulb.name;
    }

    this.LightbulbService = this.homebridgeAccessory.getService(Service.Lightbulb);
    if (!this.LightbulbService) {
      this.LightbulbService = this.homebridgeAccessory.addService(Service.Lightbulb, bulb.name);
    } else {
      this.LightbulbService.setCharacteristic(Characteristic.Name, bulb.name);
    }
    this.LightbulbService.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        this.bulb.getPowerState().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getSysInfo');
          this.log.error(reason);
          callback(new Error(reason));
        });
      })
      .on('set', (value, callback) => {
        this.bulb.setPowerState(value).then(() => {
          callback();
        }, (reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setPowerState');
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
      .setCharacteristic(Characteristic.Name, bulb.name)
      .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(Characteristic.Model, bulb.model)
      .setCharacteristic(Characteristic.SerialNumber, bulb.deviceId)
      .setCharacteristic(Characteristic.FirmwareRevision, bulb.softwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, bulb.hardwareVersion);

    this.homebridgeAccessory.context.deviceId = bulb.deviceId;
    this.homebridgeAccessory.on('identify', (paired, callback) => {
      // TODO
      callback();
    });

    this.bulb = bulb;
    this._bulb.on('power-on', (bulb) => { this.setOn(true); });
    this._bulb.on('power-off', (bulb) => { this.setOn(false); });
  }

  get bulb () { return this._bulb; }

  set bulb (bulb) {
    this._bulb = bulb;
  }

  setOn (value) {
    this.log.debug('[%s] setOn(%s)', this.homebridgeAccessory.displayName, value);
    this.homebridgeAccessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.On)
      .setValue(value);
  }
}

module.exports = BulbAccessory;
