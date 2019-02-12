'use strict';

const { HomeKitDevice } = require('.');

const { kelvinToMired, miredToKelvin } = require('../utils');

let Characteristic;
let CustomCharacteristic;

class HomeKitDeviceBulb extends HomeKitDevice {
  constructor (platform, tplinkDevice) {
    super(platform, tplinkDevice);

    Characteristic = platform.homebridge.hap.Characteristic;
    CustomCharacteristic = platform.customCharacteristics;

    this.addBasicCharacteristics();

    if (tplinkDevice.supportsBrightness) {
      this.addBrightnessCharacteristics();
    }

    if (tplinkDevice.supportsColorTemperature) {
      this.addColorTemperatureCharacteristics();
    }

    if (tplinkDevice.supportsColor) {
      this.addColorCharacteristics();
    }

    if (tplinkDevice.supportsEmeter) {
      this.addEnergyCharacteristics();
    }
  }

  identify (paired, callback) {
    this.log.debug(`[${this.name}] identify`);
    // TODO
    callback();
  }
  /**
   * @private
   */
  addBasicCharacteristics () {
    this.addCharacteristic(Characteristic.On, {
      getValue: async () => {
        return this.tplinkDevice.lighting.getLightState().then((ls) => {
          return !!(ls.on_off);
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.lighting.setLightState({ on_off: value }, { transport: 'udp' });
      }
    });
    this.tplinkDevice.on('lightstate-on', () => { this.fireCharacteristicUpdateCallback(Characteristic.On, true); });
    this.tplinkDevice.on('lightstate-off', () => { this.fireCharacteristicUpdateCallback(Characteristic.On, false); });

    this.tplinkDevice.on('lightstate-update', (lightState) => {
      if (lightState.on_off != null) {
        this.fireCharacteristicUpdateCallback(Characteristic.On, (lightState.on_off === 1));
      }
      if (lightState.brightness != null) {
        this.fireCharacteristicUpdateCallback(Characteristic.Brightness, lightState.brightness);
      }
      if (lightState.color_temp != null) {
        this.fireCharacteristicUpdateCallback(Characteristic.ColorTemperature, Math.round(kelvinToMired(lightState.color_temp)));
      }
      if (lightState.hue != null) {
        this.fireCharacteristicUpdateCallback(Characteristic.Hue, lightState.hue);
      }
      if (lightState.Saturation != null) {
        this.fireCharacteristicUpdateCallback(Characteristic.Saturation, lightState.Saturation);
      }
    });
  }
  /**
   * @private
   */
  addBrightnessCharacteristics () {
    this.addCharacteristic(Characteristic.Brightness, {
      getValue: async () => {
        return this.tplinkDevice.lighting.getLightState().then((ls) => {
          return ls.brightness;
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.lighting.setLightState({ brightness: value }, { transport: 'udp' });
      }
    });
  }
  /**
   * @private
   */
  addColorTemperatureCharacteristics () {
    this.addCharacteristic(Characteristic.ColorTemperature, {
      getValue: async () => {
        return this.tplinkDevice.lighting.getLightState().then((ls) => {
          return Math.round(kelvinToMired(ls.color_temp));
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.lighting.setLightState({ color_temp: Math.round(miredToKelvin(value)) }, { transport: 'udp' });
      }
    });
  }
  /**
 * @private
 */
  addColorCharacteristics () {
    this.addCharacteristic(Characteristic.Hue, {
      getValue: async () => {
        return this.tplinkDevice.lighting.getLightState().then((ls) => {
          return ls.hue;
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.lighting.setLightState({ hue: value, color_temp: 0 }, { transport: 'udp' });
      }
    });

    this.addCharacteristic(Characteristic.Saturation, {
      getValue: async () => {
        return this.tplinkDevice.lighting.getLightState().then((ls) => {
          return ls.saturation;
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.lighting.setLightState({ saturation: value, color_temp: 0 }, { transport: 'udp' });
      }
    });
  }
  /**
   * @private
   */
  addEnergyCharacteristics () {
    this.addCharacteristic(CustomCharacteristic.Watts, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.power;
        });
      }
    });

    this.tplinkDevice.on('emeter-realtime-update', (emeterRealtime) => {
      this.fireCharacteristicUpdateCallback(CustomCharacteristic.Watts, emeterRealtime.power);
    });
  }
}

module.exports.HomeKitDeviceBulb = HomeKitDeviceBulb;
