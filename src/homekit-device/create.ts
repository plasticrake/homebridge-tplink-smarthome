import type { PlatformAccessory } from 'homebridge';

import type TplinkSmarthomePlatform from '../platform';
import type { TplinkSmarthomeAccessoryContext } from '../platform';
import type { TplinkDevice } from '../utils';

import HomekitDevice from '.';
import HomeKitDeviceBulb from './bulb';
import HomeKitDevicePlug from './plug';
import { TplinkSmarthomeConfig } from '../config';

/**
 * Factory method to create a HomeKitDeviceBulb or HomeKitDevicePlug.
 */
export default function create(
  platform: TplinkSmarthomePlatform,
  config: TplinkSmarthomeConfig,
  homebridgeAccessory:
    | PlatformAccessory<TplinkSmarthomeAccessoryContext>
    | undefined,
  tplinkDevice: TplinkDevice
): HomekitDevice {
  if (tplinkDevice.deviceType === 'bulb') {
    return new HomeKitDeviceBulb(
      platform,
      config,
      homebridgeAccessory,
      tplinkDevice
    );
  }
  return new HomeKitDevicePlug(
    platform,
    config,
    homebridgeAccessory,
    tplinkDevice
  );
}
