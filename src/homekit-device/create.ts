import type { PlatformAccessory } from 'homebridge';

import type TplinkSmarthomePlatform from '../platform';
import type { TplinkSmarthomeAccessoryContext } from '../platform';
import type { TplinkDevice } from '../utils';

import HomekitDevice from '.';
import HomeKitDeviceBulb from './bulb';
import HomeKitDevicePlug from './plug';
import HomeKitDevicePowerStrip from './powerstrip';
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
  const powerStripModels = ['HS107', 'KP200', 'HS300', 'KP303', 'KP400', 'EP40'];

  if (tplinkDevice.deviceType === 'bulb') {
    return new HomeKitDeviceBulb(
      platform,
      config,
      homebridgeAccessory,
      tplinkDevice
    );
  } else if (powerStripModels.includes(tplinkDevice.model.slice(0,-4)) && config.powerStrip) {
    return new HomeKitDevicePowerStrip(
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
