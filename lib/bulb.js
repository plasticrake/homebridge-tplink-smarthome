'use strict';

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

const getOrAddCharacteristic = (service, characteristic) => {
  return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};

function miredToKelvin (mired) {
  return 1e6 / mired;
}
function kelvinToMired (kelvin) {
  return 1e6 / kelvin;
}

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
      this.log.debug('Creating new Accessory [%s] [%s] [%s]', bulb.alias, bulb.deviceId, UUIDGen.generate(bulb.deviceId));
      this.homebridgeAccessory = new PlatformAccessory(bulb.alias, UUIDGen.generate(bulb.deviceId), Accessory.Categories.LIGHTBULB);
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.log.debug('Existing Accessory found [%s] [%s] [%s]', homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
      this.homebridgeAccessory.displayName = bulb.alias;
    }

    this.LightbulbService = this.homebridgeAccessory.getService(Service.Lightbulb);
    if (!this.LightbulbService) {
      this.log.debug('Creating new Lightbulb Service [%s]', bulb.alias);
      this.LightbulbService = this.homebridgeAccessory.addService(Service.Lightbulb, bulb.alias);
    } else {
      this.LightbulbService.setCharacteristic(Characteristic.Name, bulb.alias);
    }

    this.LightbulbService.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        this.bulb.lighting.getLightState().then((ls) => {
          callback(null, ls.on_off);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getLightState');
          this.log.error(reason);
          callback(new Error(reason));
        });
      })
      .on('set', (value, callback) => {
        this.bulb.lighting.setLightState({ on_off: value }, { transport: 'udp' }).then(() => {
          callback();
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
          this.log.error(reason);
          callback(reason);
        });
      });

    if (bulb.supportsBrightness) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Brightness)
        .on('get', (callback) => {
          this.bulb.lighting.getLightState().then((ls) => {
            callback(null, ls.brightness);
          });
        })
        .on('set', (value, callback) => {
          this.bulb.lighting.setLightState({ brightness: value }, { transport: 'udp' }).then(() => {
            callback();
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
            this.log.error(reason);
            callback(reason);
          });
        });
    }

    if (bulb.supportsColorTemperature) {
      let { min, max } = bulb.getColorTemperatureRange;
      getOrAddCharacteristic(this.LightbulbService, Characteristic.ColorTemperature)
        .on('get', (callback) => {
          this.bulb.lighting.getLightState().then((ls) => {
            callback(null, Math.round(kelvinToMired(ls.color_temp)));
          });
        })
        .on('set', (value, callback) => {
          this.bulb.lighting.setLightState({ color_temp: Math.round(miredToKelvin(value)) }, { transport: 'udp' }).then(() => {
            callback();
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
            this.log.error(reason);
            callback(reason);
          });
        })
        .setProps({
          minValue: Math.ceil(kelvinToMired(max)), // K and Mired are reversed
          maxValue: Math.floor(kelvinToMired(min)) // K and Mired are reversed
        });
    }

    if (bulb.supportsColor) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Saturation)
        .on('get', (callback) => {
          this.bulb.lighting.getLightState().then((ls) => {
            callback(null, ls.saturation);
          });
        })
        .on('set', (value, callback) => {
          this.bulb.lighting.setLightState({ saturation: value, color_temp: 0 }, { transport: 'udp' }).then(() => {
            callback();
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setLightState');
            this.log.error(reason);
            callback(reason);
          });
        });

      getOrAddCharacteristic(this.LightbulbService, Characteristic.Hue)
        .on('get', (callback) => {
          this.bulb.lighting.getLightState().then((ls) => {
            callback(null, ls.hue);
          });
        })
        .on('set', (value, callback) => {
          this.bulb.lighting.setLightState({ hue: value, color_temp: 0 }, { transport: 'udp' }).then(() => {
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
      .setCharacteristic(Characteristic.Name, bulb.alias)
      .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(Characteristic.Model, bulb.model)
      .setCharacteristic(Characteristic.SerialNumber, bulb.mac)
      .setCharacteristic(Characteristic.FirmwareRevision, bulb.softwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, bulb.hardwareVersion);

    this.homebridgeAccessory.context.mac = bulb.macNormalized;
    this.homebridgeAccessory.context.deviceId = bulb.deviceId;

    this.homebridgeAccessory.on('identify', (paired, callback) => {
      // TODO
      callback();
    });

    this.bulb = bulb;
    this._bulb.on('lightstate-on', () => { this.setOn(true); });
    this._bulb.on('lightstate-off', () => { this.setOn(false); });
    this._bulb.on('lightstate-change', (lightState) => { this.setLightState(lightState); });
  }

  get bulb () { return this._bulb; }

  set bulb (bulb) {
    this._bulb = bulb;
  }

  setOn (value) {
    this.log.debug('[%s] setOn(%s)', this.homebridgeAccessory.displayName, value);
    this.homebridgeAccessory.getService(Service.Lightbulb)
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  setLightState (lightState) {
    this.log.debug('[%s] setLightState(%s)', this.homebridgeAccessory.displayName, lightState);
    let service = this.homebridgeAccessory.getService(Service.Lightbulb);
    if (lightState.on_off != null) {
      service.getCharacteristic(Characteristic.On).updateValue(lightState.on_off === 1);
    }
    if (lightState.brightness != null && service.testCharacteristic(Characteristic.Brightness)) {
      service.getCharacteristic(Characteristic.Brightness).updateValue(lightState.brightness);
    }
    if (lightState.color_temp != null && service.testCharacteristic(Characteristic.ColorTemperature)) {
      service.getCharacteristic(Characteristic.ColorTemperature).updateValue(Math.round(kelvinToMired(lightState.color_temp)));
      if (service.testCharacteristic(Characteristic.Hue)) {
        service.getCharacteristic(Characteristic.Hue).updateValue(0);
      }
      if (service.testCharacteristic(Characteristic.Saturation)) {
        service.getCharacteristic(Characteristic.Saturation).updateValue(0);
      }
    } else {
      if (lightState.hue != null && service.testCharacteristic(Characteristic.Hue)) {
        service.getCharacteristic(Characteristic.Hue).updateValue(lightState.hue);
      }
      if (lightState.saturation != null && service.testCharacteristic(Characteristic.Saturation)) {
        service.getCharacteristic(Characteristic.Saturation).updateValue(lightState.saturation);
      }
      if (service.testCharacteristic(Characteristic.ColorTemperature)) {
        service.getCharacteristic(Characteristic.ColorTemperature).updateValue(0);
      }
    }
  }
}

module.exports = BulbAccessory;
