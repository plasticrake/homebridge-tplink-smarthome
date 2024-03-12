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
      this.addAndConfigureOutletService(child, index);
    });

    this.getSysInfo = deferAndCombine((requestCount) => {
      this.log.debug(`executing deferred getSysInfo count: ${requestCount}`);
      return this.tplinkDevice.getSysInfo();
    }, platform.config.waitTimeUpdate);
  }

  /**
   * Aggregates getSysInfo requests
   *
   * @private
   */
  private getSysInfo: () => Promise<PlugSysinfo>;

  private addAndConfigureOutletService(child: PlugChild, index: number) {
    const { Outlet } = this.platform.Service;

    const outletService =
      this.homebridgeAccessory.getServiceById(Outlet, `outlet-${index + 1}`) ??
      this.addService(Outlet, child.alias, `outlet-${index + 1}`);

      this.addOnCharacteristic(outletService, child);

      this.addOutletInUseCharacteristic(outletService, child);

    return outletService;
  }

  private addOnCharacteristic(outletService: Service, childDevice: PlugChild) {
    const onCharacteristic = getOrAddCharacteristic(
      outletService,
      this.platform.Characteristic.On
    );

    onCharacteristic
      .onGet(async () => {
        const sysInfo = await this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        if (sysInfo) {
          const childState = sysInfo.children?.find(child => child.id === childDevice.id)?.state;
          this.log.debug(`Current State of On is: ${childState === 1 ? true : false} for ${childDevice.alias}`);
          return childState ?? 0; // immediately returned cached value
        }
        return 0;
      })
      .onSet(async (value) => {
        this.log.info(`Setting On to: ${value} for ${childDevice.alias}`);
        if (typeof value === 'boolean') {
          await this.tplinkDevice.sendCommand(
            `{"system":{"set_relay_state":{"state":${value ? 1 : 0}}}}`,
            childDevice.id,
          );
          return;
        }
        this.log.warn('setValue: Invalid On:', value);
        throw new Error(`setValue: Invalid On: ${value}`);
      });

      let oldChildState = childDevice.state;

      setInterval(async () => {
        const sysInfo = await this.tplinkDevice.getSysInfo();
        const newChildState = sysInfo.children?.find(child => child.id === childDevice.id)?.state;
      
        if (newChildState !== undefined && newChildState !== oldChildState) {
          this.updateChildValue(outletService, onCharacteristic, newChildState, childDevice);
          oldChildState = newChildState;
        }
      }, 5000); // Poll every 5 seconds


    return outletService;
  }

  private addOutletInUseCharacteristic(outletService: Service, childDevice: PlugChild) {
    const outletInUseCharacteristic = getOrAddCharacteristic(
        outletService,
        this.platform.Characteristic.OutletInUse
      );

      outletInUseCharacteristic.onGet(() => {
        this.getSysInfo().catch(this.logRejection.bind(this)); // this will eventually trigger update
        return childDevice.state; // immediately returned cached value
      });

      outletInUseCharacteristic.updateValue(childDevice.state);

    return outletService;
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
