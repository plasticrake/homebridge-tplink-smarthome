// eslint-disable-next-line import/no-extraneous-dependencies
import { Categories } from 'homebridge'; // enum
import type { Plug, PlugSysinfo } from 'tplink-smarthome-api';

import HomeKitDevice from '.';
import type TplinkSmarthomePlatform from '../platform';
import { deferAndCombine } from '../utils';

export default class HomeKitDevicePlug extends HomeKitDevice {
  private desiredPowerState?: boolean;

  constructor(
    platform: TplinkSmarthomePlatform,
    readonly tplinkDevice: Plug,
    readonly category: Categories
  ) {
    super(platform, tplinkDevice, category);

    this.addBasicCharacteristics();

    if (tplinkDevice.supportsDimmer) {
      this.addBrightnessCharacteristics();
    }
    if (
      platform.config.addCustomCharacteristics &&
      tplinkDevice.supportsEmeter
    ) {
      this.addEnergyCharacteristics();
    }

    this.getSysInfo = deferAndCombine((requestCount) => {
      this.log.debug(`executing deferred getSysInfo count: ${requestCount}`);
      return this.tplinkDevice.getSysInfo();
    }, platform.config.waitTimeUpdate);

    this.setPowerState = deferAndCombine(
      async (requestCount) => {
        this.log.debug(
          `executing deferred setPowerState count: ${requestCount}`
        );
        if (this.desiredPowerState === undefined) {
          this.log.warn(
            'setPowerState called with undefined desiredPowerState'
          );
          return Promise.resolve(true);
        }

        const ret = await this.tplinkDevice.setPowerState(
          this.desiredPowerState
        );
        this.desiredPowerState = undefined;
        return ret;
      },
      platform.config.waitTimeUpdate,
      (value: boolean) => {
        this.desiredPowerState = value;
      }
    );

    this.getRealtime = deferAndCombine((requestCount) => {
      this.log.debug(`executing deferred getRealtime count: ${requestCount}`);
      return this.tplinkDevice.emeter.getRealtime();
    }, platform.config.waitTimeUpdate);
  }

  /**
   * Aggregates getSysInfo requests
   *
   * @private
   */
  private getSysInfo: () => Promise<PlugSysinfo>;

  /**
   * Aggregates setPowerState requests
   *
   * @private
   */
  private setPowerState: (value: boolean) => Promise<true>;

  /**
   * Aggregates getRealtime requests
   *
   * @private
   */
  private getRealtime: () => Promise<unknown>;

  private addBasicCharacteristics(): void {
    this.addCharacteristic(this.platform.Characteristic.On, {
      getValue: async () => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.relayState; // immediately returned cached value
      },
      setValue: async (value) => {
        if (typeof value === 'boolean') {
          await this.setPowerState(value);
          return;
        }
        this.log.warn('setValue: Invalid On:', value);
      },
    });

    this.tplinkDevice.on('power-update', (value) => {
      this.fireCharacteristicUpdateCallback(
        this.platform.Characteristic.On,
        value
      );
    });

    if (this.category === Categories.OUTLET) {
      this.addCharacteristic(this.platform.Characteristic.OutletInUse, {
        getValue: async () => {
          this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
          return this.tplinkDevice.inUse; // immediately returned cached value
        },
      });

      this.tplinkDevice.on('in-use-update', (value) => {
        this.fireCharacteristicUpdateCallback(
          this.platform.Characteristic.OutletInUse,
          value
        );
      });
    }
  }

  private addBrightnessCharacteristics(): void {
    this.addCharacteristic(this.platform.Characteristic.Brightness, {
      getValue: async () => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.dimmer.brightness; // immediately returned cached value
      },
      setValue: async (value) => {
        if (typeof value === 'number') {
          await this.tplinkDevice.dimmer.setBrightness(value);
          return;
        }
        this.log.warn('setValue: Invalid Brightness:', value);
      },
    });

    this.tplinkDevice.on('brightness-update', (value) => {
      this.fireCharacteristicUpdateCallback(
        this.platform.Characteristic.Brightness,
        value
      );
    });
  }

  private addEnergyCharacteristics(): void {
    this.addCharacteristic(this.platform.customCharacteristics.Amperes, {
      getValue: async () => {
        this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.emeter.realtime.current ?? 0; // immediately returned cached value
      },
    });

    this.addCharacteristic(this.platform.customCharacteristics.KilowattHours, {
      getValue: async () => {
        this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.emeter.realtime.total ?? 0; // immediately returned cached value
      },
    });

    this.addCharacteristic(this.platform.customCharacteristics.VoltAmperes, {
      getValue: async () => {
        this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
        const { realtime } = this.tplinkDevice.emeter;
        return (realtime.voltage ?? 0) * (realtime.voltage ?? 0); // immediately returned cached value
      },
    });

    this.addCharacteristic(this.platform.customCharacteristics.Volts, {
      getValue: async () => {
        this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.emeter.realtime.voltage ?? 0; // immediately returned cached value
      },
    });

    this.addCharacteristic(this.platform.customCharacteristics.Watts, {
      getValue: async () => {
        this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.emeter.realtime.power ?? 0; // immediately returned cached value
      },
    });

    this.tplinkDevice.on('emeter-realtime-update', (emeterRealtime) => {
      this.fireCharacteristicUpdateCallback(
        this.platform.customCharacteristics.Amperes,
        emeterRealtime.current
      );
      this.fireCharacteristicUpdateCallback(
        this.platform.customCharacteristics.KilowattHours,
        emeterRealtime.total
      );
      this.fireCharacteristicUpdateCallback(
        this.platform.customCharacteristics.VoltAmperes,
        emeterRealtime.voltage * emeterRealtime.current
      );
      this.fireCharacteristicUpdateCallback(
        this.platform.customCharacteristics.Volts,
        emeterRealtime.voltage
      );
      this.fireCharacteristicUpdateCallback(
        this.platform.customCharacteristics.Watts,
        emeterRealtime.power
      );
    });
  }

  identify(): void {
    this.log.info(`identify`);
    this.tplinkDevice
      .blink(1, 500)
      .then(() => {
        return this.tplinkDevice.blink(2, 500);
      })
      .then(() => {
        this.log.debug(`identify done`);
      })
      .catch((reason) => {
        this.log.error(`identify complete`);
        this.log.error(reason);
      });
  }
}
