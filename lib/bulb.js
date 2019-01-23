'use strict';

const AccessoryInformation = require('./accessory-information');
const { callbackify, getOrAddCharacteristic, kelvinToMired, miredToKelvin } = require('./utils');

let Characteristic;

class BulbAccessory {
  constructor (platform, config, homebridgeAccessory, bulb) {
    this.platform = platform;
    const PlatformAccessory = platform.api.platformAccessory;
    const Accessory = platform.api.hap.Accessory;
    const Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    const UUIDGen = platform.api.hap.uuid;

    this.log = platform.log;
    this.config = config || {};

    this.homebridgeAccessory = homebridgeAccessory;

    if (!this.homebridgeAccessory) {
      const uuid = UUIDGen.generate(bulb.id);
      this.log.debug('Creating new Accessory [%s] [%s] [%s]', bulb.alias, bulb.deviceId, uuid);
      this.homebridgeAccessory = new PlatformAccessory(bulb.alias, uuid, Accessory.Categories.LIGHTBULB);
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.log.debug('Existing Accessory found [%s] [%s] [%s]', this.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID);
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
      .on('get', callbackify(this.getOn.bind(this), this.logErr('getOn')))
      .on('set', callbackify(this.setOn.bind(this), this.logErr('setOn')));

    if (bulb.supportsBrightness) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Brightness)
        .on('get', callbackify(this.getBrightness.bind(this), this.logErr('getBrightness')))
        .on('set', callbackify(this.setBrightness.bind(this), this.logErr('setBrightness')));
    }

    if (bulb.supportsColorTemperature) {
      let { min, max } = bulb.getColorTemperatureRange;
      getOrAddCharacteristic(this.LightbulbService, Characteristic.ColorTemperature)
        .on('get', callbackify(this.getColorTemperature.bind(this), this.logErr('getColorTemperature')))
        .on('set', callbackify(this.setColorTemperature.bind(this), this.logErr('setColorTemperature')))
        .setProps({
          minValue: Math.ceil(kelvinToMired(max)), // K and Mired are reversed
          maxValue: Math.floor(kelvinToMired(min)) // K and Mired are reversed
        });
    }

    if (bulb.supportsColor) {
      getOrAddCharacteristic(this.LightbulbService, Characteristic.Saturation)
        .on('get', callbackify(this.getSaturation.bind(this), this.logErr('getSaturation')))
        .on('set', callbackify(this.setSaturation.bind(this), this.logErr('setSaturation')));

      getOrAddCharacteristic(this.LightbulbService, Characteristic.Hue)
        .on('get', callbackify(this.getHue.bind(this), this.logErr('getHue')))
        .on('set', callbackify(this.setHue.bind(this), this.logErr('setHue')));
    }

    this.infoService = AccessoryInformation(platform.api.hap)(this.homebridgeAccessory, bulb);

    this.homebridgeAccessory.context.mac = bulb.macNormalized;
    this.homebridgeAccessory.context.deviceId = bulb.deviceId;

    this.homebridgeAccessory.on('identify', (paired, callback) => {
      // TODO
      callback();
    });

    this.bulb = bulb;
    this._bulb.on('lightstate-on', () => { this.updateOnValue(true); });
    this._bulb.on('lightstate-off', () => { this.updateOnValue(false); });
    this._bulb.on('lightstate-change', (lightState) => { this.updateLightStateValue(lightState); });
  }

  get displayName () {
    return this.homebridgeAccessory.displayName;
  }

  get bulb () { return this._bulb; }

  set bulb (bulb) {
    this._bulb = bulb;
  }

  getOn () {
    this.log.debug('[%s] getOn', this.displayName);
    return this.bulb.lighting.getLightState().then((ls) => {
      return !!(ls.on_off);
    });
  }

  setOn (value) {
    this.log.debug('[%s] setOn', this.displayName);
    return this.bulb.lighting.setLightState({ on_off: value }, { transport: 'udp' });
  }

  getBrightness () {
    this.log.debug('[%s] getBrightness', this.displayName);
    return this.bulb.lighting.getLightState().then((ls) => {
      return ls.brightness;
    });
  }

  setBrightness (value) {
    this.log.debug('[%s] setBrightness', this.displayName);
    return this.bulb.lighting.setLightState({ brightness: value }, { transport: 'udp' });
  }

  getColorTemperature () {
    this.log.debug('[%s] getColorTemperature', this.displayName);
    return this.bulb.lighting.getLightState().then((ls) => {
      return Math.round(kelvinToMired(ls.color_temp));
    });
  }

  setColorTemperature (value) {
    this.log.debug('[%s] setColorTemperature', this.displayName);
    return this.bulb.lighting.setLightState({ color_temp: Math.round(miredToKelvin(value)) }, { transport: 'udp' });
  }

  getSaturation () {
    this.log.debug('[%s] getSaturation', this.displayName);
    return this.bulb.lighting.getLightState().then((ls) => {
      return ls.saturation;
    });
  }

  setSaturation (value) {
    this.log.debug('[%s] setSaturation', this.displayName);
    return this.bulb.lighting.setLightState({ saturation: value, color_temp: 0 }, { transport: 'udp' });
  }

  getHue () {
    this.log.debug('[%s] getHue', this.displayName);
    return this.bulb.lighting.getLightState().then((ls) => {
      return ls.hue;
    });
  }

  setHue (value) {
    this.log.debug('[%s] setHue', this.displayName);
    return this.bulb.lighting.setLightState({ hue: value, color_temp: 0 }, { transport: 'udp' });
  }

  updateOnValue (value) {
    this.log.debug('[%s] updateOnValue(%s)', this.displayName, value);
    this.LightbulbService
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  updateLightStateValue (lightState) {
    this.log.debug('[%s] updateLightStateValue(%j)', this.displayName, lightState);
    const service = this.LightbulbService;
    if (lightState.on_off != null) {
      service.getCharacteristic(Characteristic.On).updateValue(lightState.on_off === 1);
    }
    if (lightState.brightness != null && service.testCharacteristic(Characteristic.Brightness)) {
      service.getCharacteristic(Characteristic.Brightness).updateValue(lightState.brightness);
    }
    if (lightState.color_temp != null && lightState.color_temp > 0 && service.testCharacteristic(Characteristic.ColorTemperature)) {
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

  logErr (description) {
    const fn = (reason) => {
      this.log.error('[%s] %s', this.displayName, description);
      this.log.error(reason);
    };
    return fn.bind(this);
  }
}

module.exports = BulbAccessory;
