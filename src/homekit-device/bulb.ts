// eslint-disable-next-line import/no-extraneous-dependencies
import { Categories } from 'homebridge'; // enum
import type { PlatformAccessory, Service } from 'homebridge';
import type { Bulb, LightState } from 'tplink-smarthome-api';
import type { BulbSysinfoLightState } from 'tplink-smarthome-api/lib/bulb';

import HomekitDevice from '.';
import { TplinkSmarthomeConfig } from '../config';
import type TplinkSmarthomePlatform from '../platform';
import type { TplinkSmarthomeAccessoryContext } from '../platform';
import {
  deferAndCombine,
  delay,
  getOrAddCharacteristic,
  kelvinToMired,
  miredToKelvin,
} from '../utils';

export default class HomeKitDeviceBulb extends HomekitDevice {
  private desiredLightState: LightState = {};

  constructor(
    platform: TplinkSmarthomePlatform,
    readonly config: TplinkSmarthomeConfig,
    homebridgeAccessory:
      | PlatformAccessory<TplinkSmarthomeAccessoryContext>
      | undefined,
    readonly tplinkDevice: Bulb
  ) {
    super(
      platform,
      config,
      homebridgeAccessory,
      tplinkDevice,
      Categories.LIGHTBULB
    );

    const primaryService = this.addLightbulbService({
      supportsBrightness: tplinkDevice.supportsBrightness,
      supportsColorTemperature: tplinkDevice.supportsColorTemperature,
      supportsColor: tplinkDevice.supportsColor,
    });

    if (
      platform.config.addCustomCharacteristics &&
      tplinkDevice.supportsEmeter
    ) {
      this.addEnergyCharacteristics(primaryService);
    } else {
      this.removeEnergyCharacteristics(primaryService);
    }

    this.getLightState = deferAndCombine((requestCount) => {
      this.log.debug(`executing deferred getLightState count: ${requestCount}`);
      return this.tplinkDevice.getSysInfo().then((si) => {
        return si.light_state;
      });
    }, platform.config.waitTimeUpdate);

    this.setLightState = deferAndCombine(
      (requestCount) => {
        this.log.debug(
          `executing deferred setLightState count: ${requestCount}`
        );
        if (Object.keys(this.desiredLightState).length === 0) {
          this.log.warn('setLightState called with empty desiredLightState');
          return Promise.resolve(true);
        }

        const ret = this.tplinkDevice.lighting.setLightState(
          this.desiredLightState
        );
        this.desiredLightState = {};
        return ret;
      },
      platform.config.waitTimeUpdate,
      (value: LightState) => {
        this.desiredLightState = Object.assign(this.desiredLightState, value);
      }
    );

    this.getRealtime = deferAndCombine(() => {
      return this.tplinkDevice.emeter.getRealtime();
    }, platform.config.waitTimeUpdate);
  }

  /**
   * Aggregates getLightState requests
   *
   * @private
   */
  private getLightState: () => Promise<LightState>;

  /**
   * Aggregates setLightState requests
   *
   * @private
   */
  private setLightState: (value: LightState) => Promise<true>;

  /**
   * Aggregates getRealtime requests
   *
   * @private
   */
  private getRealtime: () => Promise<unknown>;

  private addLightbulbService({
    supportsBrightness,
    supportsColorTemperature,
    supportsColor,
  }: {
    supportsBrightness: boolean;
    supportsColorTemperature: boolean;
    supportsColor: boolean;
  }) {
    const { Lightbulb } = this.platform.Service;
    const { Characteristic } = this.platform;

    const lightbulbService =
      this.homebridgeAccessory.getService(Lightbulb) ??
      this.addService(Lightbulb, this.name);

    const onCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      Characteristic.On
    );

    onCharacteristic
      .onGet(() => {
        this.getLightState().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.sysInfo.light_state.on_off === 1; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting On to: ${value}`);
        if (typeof value === 'boolean') {
          await this.setLightState({ on_off: value ? 1 : 0 });
          return;
        }
        this.log.warn('setValue: Invalid On:', value);
      });

    this.tplinkDevice.on('lightstate-on', () => {
      this.updateValue(lightbulbService, onCharacteristic, true);
    });
    this.tplinkDevice.on('lightstate-sysinfo-on', () => {
      this.updateValue(lightbulbService, onCharacteristic, true);
    });
    this.tplinkDevice.on('lightstate-off', () => {
      this.updateValue(lightbulbService, onCharacteristic, false);
    });
    this.tplinkDevice.on('lightstate-sysinfo-off', () => {
      this.updateValue(lightbulbService, onCharacteristic, false);
    });
    const onUpdateListener = (
      lightState: LightState | BulbSysinfoLightState
    ) => {
      if (lightState.on_off != null) {
        this.updateValue(
          lightbulbService,
          onCharacteristic,
          lightState.on_off === 1
        );
      }
    };
    this.tplinkDevice.on('lightstate-update', onUpdateListener);
    this.tplinkDevice.on('lightstate-sysinfo-update', onUpdateListener);

    if (supportsBrightness) {
      this.addBrightnessCharacteristic(lightbulbService);
    } else {
      this.removeBrightnessCharacteristic(lightbulbService);
    }

    if (supportsColorTemperature) {
      this.addColorTemperatureCharacteristic(lightbulbService);
    } else {
      this.removeColorTemperatureCharacteristic(lightbulbService);
    }

    if (supportsColor) {
      this.addColorCharacteristics(lightbulbService);
    } else {
      this.removeColorCharacteristics(lightbulbService);
    }

    return lightbulbService;
  }

  private addBrightnessCharacteristic(lightbulbService: Service) {
    const brightnessCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      this.platform.Characteristic.Brightness
    );

    brightnessCharacteristic
      .onGet(() => {
        this.getLightState().catch(this.logRejection.bind(this)); // this will eventually trigger update
        const ls = this.tplinkDevice.sysInfo.light_state;
        return ls.brightness ?? ls.dft_on_state?.brightness ?? 0; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting Brightness to: ${value}`);
        if (typeof value === 'number') {
          await this.setLightState({ brightness: value });
          return;
        }
        this.log.warn('setValue: Invalid Brightness:', value);
      });

    const brightnessUpdateListener = (
      lightState: LightState | BulbSysinfoLightState
    ) => {
      if (lightState.brightness != null) {
        this.updateValue(
          lightbulbService,
          brightnessCharacteristic,
          lightState.brightness
        );
      }
    };
    this.tplinkDevice.on('lightstate-update', brightnessUpdateListener);
    this.tplinkDevice.on('lightstate-sysinfo-update', brightnessUpdateListener);

    return brightnessCharacteristic;
  }

  private removeBrightnessCharacteristic(service: Service) {
    this.removeCharacteristicIfExists(
      service,
      this.platform.Characteristic.Brightness
    );
  }

  private addColorTemperatureCharacteristic(lightbulbService: Service) {
    const range = this.tplinkDevice.colorTemperatureRange;

    if (range == null) {
      this.log.error('Could not retrieve color temperature range');
      return undefined;
    }

    const { min, max } = range;

    const colorTemperatureCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      this.platform.Characteristic.ColorTemperature
    );

    colorTemperatureCharacteristic.setProps({
      minValue: Math.ceil(kelvinToMired(max)), // K and Mired are reversed
      maxValue: Math.floor(kelvinToMired(min)), // K and Mired are reversed
    });

    colorTemperatureCharacteristic
      .onGet(() => {
        this.getLightState().catch(this.logRejection.bind(this)); // this will eventually trigger update
        const ls = this.tplinkDevice.sysInfo.light_state;

        // immediately returned cached value
        if (typeof ls.color_temp === 'number' && ls.color_temp > 0) {
          return Math.round(kelvinToMired(ls.color_temp));
        }
        if (
          typeof ls.dft_on_state?.color_temp === 'number' &&
          ls.dft_on_state.color_temp > 0
        ) {
          return Math.round(kelvinToMired(ls.dft_on_state.color_temp));
        }
        if (!('color_temp' in ls)) {
          return Math.floor(kelvinToMired(min));
        }

        return Math.floor(kelvinToMired(min));
      })
      .onSet(async (value) => {
        this.log.info(`Setting ColorTemperature to: ${value}`);
        if (typeof value === 'number') {
          await this.setLightState({
            color_temp: Math.round(miredToKelvin(value)),
          });
          return;
        }
        this.log.warn('setValue: Invalid ColorTemperature:', value);
      });

    if (colorTemperatureCharacteristic != null) {
      const colorTemperatureUpdateListener = (
        lightState: LightState | BulbSysinfoLightState
      ) => {
        if (lightState.color_temp != null && lightState.color_temp > 0) {
          this.updateValue(
            lightbulbService,
            colorTemperatureCharacteristic,
            Math.round(kelvinToMired(lightState.color_temp))
          );
        }
      };
      this.tplinkDevice.on('lightstate-update', colorTemperatureUpdateListener);
      this.tplinkDevice.on(
        'lightstate-sysinfo-update',
        colorTemperatureUpdateListener
      );
    }

    return colorTemperatureCharacteristic;
  }

  private removeColorTemperatureCharacteristic(service: Service) {
    this.removeCharacteristicIfExists(
      service,
      this.platform.Characteristic.ColorTemperature
    );
  }

  private addColorCharacteristics(lightbulbService: Service) {
    const hueCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      this.platform.Characteristic.Hue
    );

    hueCharacteristic
      .onGet(() => {
        this.getLightState().catch(this.logRejection.bind(this)); // this will eventually trigger update
        const ls = this.tplinkDevice.sysInfo.light_state;
        return ls.hue ?? ls.dft_on_state?.hue ?? 0; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting Hue to: ${value}`);
        if (typeof value === 'number') {
          await this.setLightState({ hue: value, color_temp: 0 });
          return;
        }
        this.log.warn('setValue: Invalid Hue:', value);
      });

    const saturationCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      this.platform.Characteristic.Saturation
    );

    saturationCharacteristic
      .onGet(() => {
        this.getLightState().catch(this.logRejection.bind(this)); // this will eventually trigger update
        const ls = this.tplinkDevice.sysInfo.light_state;
        return ls.saturation ?? ls.dft_on_state?.saturation ?? 0; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting Saturation to: ${value}`);
        if (typeof value === 'number') {
          await this.setLightState({ saturation: value, color_temp: 0 });
          return;
        }
        this.log.warn('setValue: Invalid Saturation:', value);
      });

    const colorUpdateListener = (
      lightState: LightState | BulbSysinfoLightState
    ) => {
      if (lightState.color_temp != null && lightState.color_temp > 0) {
        this.updateValue(lightbulbService, hueCharacteristic, 0);
        this.updateValue(lightbulbService, saturationCharacteristic, 0);
      } else {
        if (lightState.hue != null) {
          this.updateValue(lightbulbService, hueCharacteristic, lightState.hue);
        }
        if (lightState.saturation != null) {
          this.updateValue(
            lightbulbService,
            saturationCharacteristic,
            lightState.saturation
          );
        }
      }
    };
    this.tplinkDevice.on('lightstate-update', colorUpdateListener);
    this.tplinkDevice.on('lightstate-sysinfo-update', colorUpdateListener);

    return { hueCharacteristic, saturationCharacteristic };
  }

  private removeColorCharacteristics(service: Service) {
    [
      this.platform.Characteristic.Hue,
      this.platform.Characteristic.Saturation,
    ].forEach((c) => {
      this.removeCharacteristicIfExists(service, c);
    });
  }

  private addEnergyCharacteristics(lightbulbService: Service) {
    const wattsCharacteristic = getOrAddCharacteristic(
      lightbulbService,
      this.platform.customCharacteristics.Watts
    );

    wattsCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update

      // immediately returned cached value
      const emeterRealtime = this.tplinkDevice.emeter.realtime;
      if (typeof emeterRealtime.power === 'number') {
        return emeterRealtime.power;
      }
      this.log.warn(`getValue: Invalid Watts:`, emeterRealtime.power);
      return null;
    });

    this.tplinkDevice.on('emeter-realtime-update', (emeterRealtime) => {
      this.updateValue(
        lightbulbService,
        wattsCharacteristic,
        emeterRealtime.power ?? new Error('Could not retrieve watts')
      );
    });
  }

  private removeEnergyCharacteristics(lightbulbService: Service) {
    this.removeCharacteristicIfExists(
      lightbulbService,
      this.platform.customCharacteristics.Watts
    );
  }

  identify(): void {
    this.log.debug(`identify`);
    (async () => {
      try {
        const origLs = await this.getLightState();

        for (let i = 0; i < 3; i += 1) {
          /* eslint-disable no-await-in-loop */
          await this.setLightState({ on_off: 1, brightness: 100 });
          await delay(500);
          await this.setLightState({ on_off: 1, brightness: 10 });
          await delay(500);
          /* eslint-enable no-await-in-loop */
        }

        this.setLightState(origLs);
      } catch (err) {
        this.log.error(`identify error`);
        this.log.error(String(err));
      }
      this.log.debug(`identify complete`);
    })();
  }
}
