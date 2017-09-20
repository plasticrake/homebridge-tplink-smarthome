'use strict';

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

const getOrAddCharacteristic = (service, characteristic) => {
  return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};

class BulbAccessory {
  constructor (platform, config, homebridgeAccessory, bulb) {
    this.platform = platform;
    PlatformAccessory = platform.api.platformAccessory;
    Accessory = platform.api.hap.Accessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;

    this.log = platform.log;
    this.config = config || {};

    this.homebridgeAccessory = homebridgeAccessory;

    if (!this.homebridgeAccessory) {
      this.log.debug('creating new Accessory [%s] [%s] [%s]', bulb.name, bulb.deviceId, UUIDGen.generate(bulb.deviceId));
      this.homebridgeAccessory = new PlatformAccessory(bulb.name, UUIDGen.generate(bulb.deviceId), Accessory.Categories.LIGHTBULB);
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.log.debug('exising Accessory found [%s] [%s] [%s]', homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
      this.homebridgeAccessory.displayName = bulb.name;
    }

    this.LightbulbService = this.homebridgeAccessory.getService(Service.Lightbulb);
    if (!this.LightbulbService) {
      this.log.debug('creating new Lightbulb Service [%s]', bulb.name);
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

    if (bulb.sysInfo.is_dimmable === 1) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Brightness)
      .on('get', (callback) => {
        this.bulb.getLightState().then((ls) => {
          callback(null, ls.brightness);
        });
      })
      .on('set', (value, callback) => {
        this.bulb.setLightState({brightness: value}).then(() => {
          callback();
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
          this.log.error(reason);
          callback(reason);
        });
      });
    }

    if (bulb.sysInfo.is_variable_color_temp === 1) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.ColorTemperature)
        .on('get', (callback) => {
          this.bulb.getLightState().then((ls) => {
            callback(null, ls.color_temp);
          });
        })
        .on('set', (value, callback) => {
          this.bulb.setLightState({color_temp: value}).then(() => {
            callback();
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
            this.log.error(reason);
            callback(reason);
          });
        });
    }

    if (bulb.sysInfo.is_color === 1) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Saturation)
      .on('get', (callback) => {
        this.bulb.getLightState().then((ls) => {
          callback(null, ls.saturation);
        });
      })
      .on('set', (value, callback) => {
        this.bulb.setLightState({saturation: value}).then(() => {
          callback();
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
          this.log.error(reason);
          callback(reason);
        });
      });

      getOrAddCharacteristic(this.LightbulbService, Characteristic.Hue)
      .on('get', (callback) => {
        this.bulb.getLightState().then((ls) => {
          callback(null, ls.hue);
        });
      })
      .on('set', (value, callback) => {
        this.bulb.setLightState({hue: value}).then(() => {
          callback();
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
          this.log.error(reason);
          callback(reason);
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
    this.homebridgeAccessory.getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .setValue(value);
  }
}

module.exports = BulbAccessory;
