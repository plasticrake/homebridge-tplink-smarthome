// eslint-disable-next-line import/no-extraneous-dependencies
import { Categories } from 'homebridge'; // enum
import type { Service, PlatformAccessory } from 'homebridge';
import type { Plug, PlugChild, PlugSysinfo } from 'tplink-smarthome-api';

import HomekitDevice from '.';
import { TplinkSmarthomeConfig } from '../config';
import type TplinkSmarthomePlatform from '../platform';
import type { TplinkSmarthomeAccessoryContext } from '../platform';
import { deferAndCombine, getOrAddCharacteristic } from '../utils';

export default class HomeKitDevicePowerStrip extends HomekitDevice {

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
      Categories.OUTLET
    );

    this.tplinkDevice.sysInfo.children?.forEach((child, index) => {
      var service = this.addOutletService(child, index);

      service = this.configureOutletService(service, child);
    });

    this.log.debug(`Device ID: ${this.tplinkDevice.id}`);

    this.getSysInfo = deferAndCombine((requestCount) => {
      this.log.debug(`executing deferred getSysInfo count: ${requestCount}`);
      return this.tplinkDevice.getSysInfo();
    }, platform.config.waitTimeUpdate);

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
   * Aggregates getRealtime requests
   *
   * @private
   */
  private getRealtime: () => Promise<unknown>;

  private addOutletService(child: PlugChild, index: number) {
    const { Outlet } = this.platform.Service;

    const outletService =
      this.homebridgeAccessory.getServiceById(Outlet, `outlet-${index + 1}`) ??
      this.addService(Outlet, child.alias, `outlet-${index + 1}`);

    return outletService;
  }

  private configureOutletService(service: Service, child: PlugChild) {

    this.addOnCharacteristic(service, child);

    this.addOutletInUseCharacteristic(service, child);

    if (
      this.platform.config.addCustomCharacteristics &&
      this.tplinkDevice.supportsEmeter
    ) {
      this.addEnergyCharacteristics(service);
    } else {
      this.removeEnergyCharacteristics(service);
    }

    return service;
  }

  private addOnCharacteristic(service: Service, childDevice: PlugChild) {
    const onCharacteristic = getOrAddCharacteristic(
      service,
      this.platform.Characteristic.On
    );

    onCharacteristic
      .onGet(() => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return childDevice.state; // immediately returned cached value
      })
      .onSet(async (value) => {
        this.log.info(`Setting On to: ${value} for ${childDevice.alias}`);
        if (typeof value === 'boolean') {
          if (value === true) {
              var command = { 'system': { 'set_relay_state': { 'state': 1, 'context': { 'child_ids': [childDevice.id] } } } };
            } else {
              var command = { 'system': { 'set_relay_state': { 'state': 0, 'context': { 'child_ids': [childDevice.id] } } } };
          }
          await this.tplinkDevice.send(command);
          return;
        }
        this.log.warn('setValue: Invalid On:', value);
        throw new Error(`setValue: Invalid On: ${value}`);
      });

    onCharacteristic.updateValue(childDevice.state);

    return service;
  }

  private addOutletInUseCharacteristic(service: Service, childDevice: PlugChild) {
    const outletInUseCharacteristic = getOrAddCharacteristic(
        service,
        this.platform.Characteristic.OutletInUse
      );

      outletInUseCharacteristic.onGet(() => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return childDevice.state; // immediately returned cached value
      });

      outletInUseCharacteristic.updateValue(childDevice.state);

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
