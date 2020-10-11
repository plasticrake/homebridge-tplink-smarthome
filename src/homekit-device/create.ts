import type TplinkSmarthomePlatform from '../platform';
import type { TplinkDevice } from '../utils';

import HomeKitDevice from '.';
import HomeKitDeviceBulb from './bulb';
import HomeKitDevicePlug from './plug';

/**
 * Factory method to create a HomeKitDeviceBulb or HomeKitDevicePlug.
 */
export default function create(
  platform: TplinkSmarthomePlatform,
  tplinkDevice: TplinkDevice
): HomeKitDevice {
  if (tplinkDevice.deviceType === 'bulb') {
    return new HomeKitDeviceBulb(platform, tplinkDevice);
  }
  return new HomeKitDevicePlug(platform, tplinkDevice);
}
