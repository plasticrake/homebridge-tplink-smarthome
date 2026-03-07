// eslint-disable-next-line import/no-extraneous-dependencies
import { Categories } from 'homebridge'; // enum
import type { Service, PlatformAccessory } from 'homebridge';
import type { Plug, PlugSysinfo } from 'tplink-smarthome-api';

import HomekitDevice from '.';
import { TplinkSmarthomeConfig } from '../config';
import type TplinkSmarthomePlatform from '../platform';
import type { TplinkSmarthomeAccessoryContext } from '../platform';
import { deferAndCombine, getOrAddCharacteristic } from '../utils';

export default class HomeKitDevicePlug extends HomekitDevice {
  private desiredPowerState?: boolean;

  constructor(
    platform: TplinkSmarthomePlatform,
    readonly config: TplinkSmarthomeConfig,
    homebridgeAccessory:
      | PlatformAccessory<TplinkSmarthomeAccessoryContext>
      | undefined,
    readonly tplinkDevice: Plug
  ) {
    super(
      platform,
      config,
      homebridgeAccessory,
      tplinkDevice,
      ((): Categories => {
        if (
          config.switchModels &&
          config.switchModels.findIndex((m) =>
            tplinkDevice.model.includes(m)
          ) !== -1
        ) {
          return Categories.SWITCH;
        }
        return tplinkDevice.supportsDimmer
          ? Categories.LIGHTBULB
          : Categories.OUTLET;
      })()
    );

    let primaryService;
    if (this.category === Categories.LIGHTBULB) {
      primaryService = this.addLightbulbService();
      this.removeOutletService();
      this.removeSwitchService();
    } else if (this.category === Categories.OUTLET) {
      primaryService = this.addOutletService();
      this.removeLightbulbService();
      this.removeSwitchService();
    } else if (this.category === Categories.SWITCH) {
      primaryService = this.addSwitchService();
      this.removeLightbulbService();
      this.removeOutletService();
    } else {
      throw new Error(
        `constructor: Invalid category: ${
          this.category
        } (${this.category.toString()})`
      );
    }

    if (
      platform.config.addCustomCharacteristics &&
      tplinkDevice.supportsEmeter
    ) {
      this.addEnergyCharacteristics(primaryService);
    } else {
      this.removeEnergyCharacteristics(primaryService);
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

  private addOutletService() {
    const { Outlet } = this.platform.Service;
    const { Characteristic } = this.platform;

    const outletService =
      this.homebridgeAccessory.getService(Outlet) ??
      this.addService(Outlet, this.name);

    this.addOnCharacteristic(outletService);

    const outletInUseCharacteristic = getOrAddCharacteristic(
      outletService,
      Characteristic.OutletInUse
    );

    outletInUseCharacteristic.onGet(() => {
      this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
      return this.tplinkDevice.inUse; // immediately returned cached value
    });

    this.tplinkDevice.on('in-use-update', (value) => {
      this.updateValue(outletService, outletInUseCharacteristic, value);
    });

    return outletService;
  }

  private removeOutletService() {
    this.removeServiceIfExists(this.platform.Service.Outlet);
  }

  private addSwitchService() {
    const { Switch } = this.platform.Service;

    const switchService =
      this.homebridgeAccessory.getService(Switch) ??
      this.addService(Switch, this.name);

    this.addOnCharacteristic(switchService);

    return switchService;
  }

  private removeSwitchService() {
    this.removeServiceIfExists(this.platform.Service.Switch);
  }

  private addLightbulbService() {
    const { Lightbulb } = this.platform.Service;

    const lightbulbService =
      this.homebridgeAccessory.getService(Lightbulb) ??
      this.addService(Lightbulb, this.name);

    this.addOnCharacteristic(lightbulbService);

    return lightbulbService;
  }

  private removeLightbulbService() {
    this.removeServiceIfExists(this.platform.Service.Lightbulb);
  }

  private addOnCharacteristic(service: Service) {
    const onCharacteristic = getOrAddCharacteristic(
      service,
      this.platform.Characteristic.On
    );

    onCharacteristic
      .onGet(() => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.relayState; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting On to: ${value}`);
        if (typeof value === 'boolean') {
          await this.setPowerState(value);
          return;
        }
        this.log.warn('setValue: Invalid On:', value);
        throw new Error(`setValue: Invalid On: ${value}`);
      });

    this.tplinkDevice.on('power-update', (value) => {
      this.updateValue(service, onCharacteristic, value);
    });

    if (this.tplinkDevice.supportsDimmer) {
      this.addBrightnessCharacteristic(service);
    }

    return service;
  }

  private addBrightnessCharacteristic(service: Service) {
    const brightnessCharacteristic = getOrAddCharacteristic(
      service,
      this.platform.Characteristic.Brightness
    );
    brightnessCharacteristic
      .onGet(() => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return this.tplinkDevice.dimmer.brightness; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting Brightness to: ${value}`);
        if (typeof value === 'number') {
          if (value > 0) {
            await this.tplinkDevice.dimmer.setBrightness(value);
          } else {
            await this.tplinkDevice.setPowerState(false);
          }
          return;
        }
        this.log.warn('setValue: Invalid Brightness:', value);
        throw new Error(`setValue: Invalid Brightness: ${value}`);
      });

    this.tplinkDevice.on('brightness-update', (value) => {
      this.updateValue(service, brightnessCharacteristic, value);
    });

    return service;
  }

  private addEnergyCharacteristics(service: Service): void {
    const { Amperes, KilowattHours, VoltAmperes, Volts, Watts } =
      this.platform.customCharacteristics;

    const amperesCharacteristic = getOrAddCharacteristic(service, Amperes);
    amperesCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
      return this.tplinkDevice.emeter.realtime.current ?? 0; // immediately returned cached value
    });

    const kilowattCharacteristic = getOrAddCharacteristic(
      service,
      KilowattHours
    );
    kilowattCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
      return this.tplinkDevice.emeter.realtime.total ?? 0; // immediately returned cached value
    });

    const voltAmperesCharacteristic = getOrAddCharacteristic(
      service,
      VoltAmperes
    );
    voltAmperesCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
      const { realtime } = this.tplinkDevice.emeter;
      return (realtime.voltage ?? 0) * (realtime.voltage ?? 0); // immediately returned cached value
    });

    const voltsCharacteristic = getOrAddCharacteristic(service, Volts);
    voltsCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
      return this.tplinkDevice.emeter.realtime.voltage ?? 0; // immediately returned cached value
    });

    const wattsCharacteristic = getOrAddCharacteristic(service, Watts);
    wattsCharacteristic.onGet(() => {
      this.getRealtime().catch(this.logRejection.bind(this)); // this will eventually trigger update
      return this.tplinkDevice.emeter.realtime.power ?? 0; // immediately returned cached value
    });

    this.tplinkDevice.on('emeter-realtime-update', (emeterRealtime) => {
      this.updateValue(
        service,
        amperesCharacteristic,
        emeterRealtime.current ?? null
      );
      this.updateValue(
        service,
        kilowattCharacteristic,
        emeterRealtime.total ?? null
      );
      this.updateValue(
        service,
        voltAmperesCharacteristic,
        emeterRealtime.voltage != null && emeterRealtime.current != null
          ? emeterRealtime.voltage * emeterRealtime.current
          : null
      );
      this.updateValue(
        service,
        voltsCharacteristic,
        emeterRealtime.voltage ?? null
      );
      this.updateValue(
        service,
        wattsCharacteristic,
        emeterRealtime.power ?? null
      );
    });
  }

  private removeEnergyCharacteristics(service: Service) {
    const { Amperes, KilowattHours, VoltAmperes, Volts, Watts } =
      this.platform.customCharacteristics;

    [Amperes, KilowattHours, VoltAmperes, Volts, Watts].forEach(
      (characteristic) => {
        this.removeCharacteristicIfExists(service, characteristic);
      }
    );
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
