import defaults from 'lodash.defaults';

import { isObjectLike } from './utils';

export interface TplinkSmarthomeConfigInput {
  // ==================
  // HomeKit
  // ------------------
  /**
   * Adds energy monitoring characteristics viewable in Eve app
   * plug: Amperes, KilowattHours, VoltAmperes, Volts, Watts
   * bulb: Watts
   * @defaultValue true
   */
  addCustomCharacteristics?: boolean;
  /**
   * (Watts) For plugs that support energy monitoring (e.g. HS110), min power draw for OutletInUse
   * @defaultValue 0
   */
  inUseThreshold?: number;
  /**
   * Matching models are created in HomeKit as a Switch instead of an Outlet
   * @defaultValue ['HS200', 'HS210']
   */
  switchModels?: Array<string>;

  // ==================
  // Discovery
  // ------------------
  /**
   * port to bind udp socket
   */
  port?: number | undefined;
  /**
   * Broadcast Address. If discovery is not working tweak to match your subnet, eg: 192.168.0.255
   * @defaultValue '255.255.255.255'
   */
  broadcast?: string;
  /**
   * (seconds) How often to check device status in the background
   * @defaultValue 10
   */
  pollingInterval?: number;
  /**
   * ["plug", "bulb"] to find all TPLink device types or ["plug"] / ["bulb"] for only plugs or bulbs
   * @defaultValue ["plug", "bulb"]
   */
  deviceTypes?: Array<'plug' | 'bulb'>;
  /**
   * Allow-list of mac addresses to include. If specified will ignore other devices.
   * MAC Addresses are normalized, special characters are removed and made uppercase for comparison.
   * Supports glob-style patterns
   */
  macAddresses?: Array<string>;
  /**
   * Deny-list of mac addresses to exclude.
   * MAC Addresses are normalized, special characters are removed and made uppercase for comparison.
   * Supports glob-style patterns
   */
  excludeMacAddresses?: Array<string>;
  /**
   * Manual list of devices (see "Manually Specifying Devices" section below)
   */
  devices?: Array<{ host: string; port?: number | undefined }>;

  // ==================
  // Advanced Settings
  // ------------------
  /**
   * (seconds) communication timeout
   * @defaultValue 15
   */
  timeout?: number;
  /**
   * Use 'tcp' or 'udp' for device communication. Discovery will always use 'udp'
   */
  transport?: 'tcp' | 'udp';
  /**
   * (milliseconds) The time to wait to combine similar commands for a device before sending a command to a device
   * @defaultValue 100
   */
  waitTimeUpdate?: number;
}

type TplinkSmarthomeConfigDefault = {
  addCustomCharacteristics: boolean;
  inUseThreshold: number;
  switchModels: Array<string>;

  broadcast: string;
  pollingInterval: number;
  deviceTypes: Array<'plug' | 'bulb'>;
  macAddresses?: Array<string>;
  excludeMacAddresses?: Array<string>;
  devices?: Array<{ host: string; port?: number | undefined }>;

  timeout: number;
  transport: 'tcp' | 'udp' | undefined;
  waitTimeUpdate: number;
};

export type TplinkSmarthomeConfig = {
  addCustomCharacteristics: boolean;
  switchModels: Array<string>;
  waitTimeUpdate: number;

  defaultSendOptions: {
    timeout: number;
    transport: 'tcp' | 'udp' | undefined;
  };

  discoveryOptions: {
    port: number | undefined;
    broadcast: string;
    discoveryInterval: number;
    deviceTypes?: Array<'plug' | 'bulb'>;
    deviceOptions: {
      defaultSendOptions: {
        timeout: number;
        transport: 'tcp' | 'udp' | undefined;
      };
      inUseThreshold: number;
    };
    macAddresses?: Array<string>;
    excludeMacAddresses?: Array<string>;
    devices?: Array<{ host: string; port?: number | undefined }>;
  };
};

export const defaultConfig: TplinkSmarthomeConfigDefault = {
  addCustomCharacteristics: true,
  inUseThreshold: 0,
  switchModels: ['HS200', 'HS210'],

  port: undefined,
  broadcast: '255.255.255.255',
  pollingInterval: 10,
  deviceTypes: ['bulb', 'plug'],
  macAddresses: undefined,
  excludeMacAddresses: undefined,
  devices: undefined,

  timeout: 15,
  transport: undefined,
  waitTimeUpdate: 100,
};

function isArrayOfStrings(value: unknown): value is Array<string> {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isTplinkSmarthomeConfigInput(
  c: unknown
): c is TplinkSmarthomeConfigInput {
  return (
    isObjectLike(c) &&
    (!('timeout' in c) || typeof c.timeout === 'number') &&
    (!('pollingInterval' in c) || typeof c.pollingInterval === 'number') &&
    (!('inUseThreshold' in c) || typeof c.inUseThreshold === 'number') &&
    (!('switchModels' in c) || isArrayOfStrings(c.switchModels)) &&
    (!('deviceTypes' in c) || isArrayOfStrings(c.deviceTypes)) &&
    (!('waitTimeUpdate' in c) || typeof c.waitTimeUpdate === 'number')
  );
}

export function parseConfig(
  config: Record<string, unknown>
): TplinkSmarthomeConfig {
  if (!isTplinkSmarthomeConfigInput(config)) throw new TypeError();

  const c = defaults(config, defaultConfig);

  const defaultSendOptions = {
    timeout: c.timeout * 1000,
    transport: c.transport,
  };

  return {
    addCustomCharacteristics: Boolean(c.addCustomCharacteristics),
    switchModels: c.switchModels,

    waitTimeUpdate: c.waitTimeUpdate,

    defaultSendOptions,

    discoveryOptions: {
      port: c.port,
      broadcast: c.broadcast,
      discoveryInterval: c.pollingInterval * 1000,
      deviceTypes: c.deviceTypes,
      deviceOptions: {
        defaultSendOptions,
        inUseThreshold: c.inUseThreshold,
      },
      macAddresses: c.macAddresses,
      excludeMacAddresses: c.excludeMacAddresses,
      devices: c.devices,
    },
  };
}
