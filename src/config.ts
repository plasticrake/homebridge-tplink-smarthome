import Ajv, { ErrorObject as AjvErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import defaults from 'lodash.defaults';

import { isObjectLike } from './utils';

export class ConfigParseError extends Error {
  /**
   * Set by `Error.captureStackTrace`
   */
  readonly stack = '';

  constructor(
    message: string,
    readonly errors?:
      | AjvErrorObject<string, Record<string, unknown>, unknown>[]
      | null
      | undefined
  ) {
    super(message);

    // remove leading / from dataPath
    const errorsAsString =
      errors != null
        ? errors
            .map((e) => {
              let msg = `\`${e.instancePath.replace(/^\//, '')}\` ${e.message}`;
              if ('allowedValues' in e.params) {
                msg += `. Allowed values: ${JSON.stringify(
                  e.params.allowedValues
                )}`;
              }
              return msg;
            })
            .join('\n')
        : '';

    this.name = 'ConfigParseError';
    if (errorsAsString === '') {
      this.message = message;
    } else {
      this.message = `${message}:\n${errorsAsString}`;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
export interface DeviceConfigInput {
  host: string;
  port?: number | undefined;
}
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
   * How often to check device energy monitoring the background (seconds). Set to 0 to disable.
   * @defaultValue 20
   */
  emeterPollingInterval?: number;
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
  discoveryPort?: number;
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
   * Allow-list of MAC addresses to include. If specified will ignore other devices.
   * MAC Addresses are normalized, special characters are removed and made uppercase for comparison.
   * Supports glob-style patterns
   */
  macAddresses?: Array<string>;
  /**
   * Deny-list of MAC addresses to exclude.
   * MAC Addresses are normalized, special characters are removed and made uppercase for comparison.
   * Supports glob-style patterns
   */
  excludeMacAddresses?: Array<string>;
  /**
   * Manual list of devices (see "Manually Specifying Devices" section below)
   */
  devices?: Array<DeviceConfigInput>;

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
  /**
   * When true, sets the device port to the port the device used when responding to the discovery ping.
   * When false, always uses default port (9999).
   * You probably don't want to change this.
   */
  devicesUseDiscoveryPort?: boolean;
}

type TplinkSmarthomeConfigDefault = {
  addCustomCharacteristics: boolean;
  emeterPollingInterval: number;
  inUseThreshold: number;
  switchModels: Array<string>;

  discoveryPort: number;
  broadcast: string;
  pollingInterval: number;
  deviceTypes: Array<'plug' | 'bulb'>;
  macAddresses?: Array<string>;
  excludeMacAddresses?: Array<string>;
  devices?: Array<{ host: string; port?: number | undefined }>;

  timeout: number;
  transport: 'tcp' | 'udp' | undefined;
  waitTimeUpdate: number;
  devicesUseDiscoveryPort: boolean;
};

export type TplinkSmarthomeConfig = {
  addCustomCharacteristics: boolean;
  emeterPollingInterval: number;
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
    devicesUseDiscoveryPort: boolean;
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
  emeterPollingInterval: 20,
  inUseThreshold: 0,
  switchModels: ['HS200', 'HS210'],

  discoveryPort: 0,
  broadcast: '255.255.255.255',
  pollingInterval: 10,
  deviceTypes: ['bulb', 'plug'],
  macAddresses: undefined,
  excludeMacAddresses: undefined,
  devices: undefined,

  timeout: 15,
  transport: undefined,
  waitTimeUpdate: 100,
  devicesUseDiscoveryPort: false,
};

function isArrayOfStrings(value: unknown): value is Array<string> {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isDeviceConfigInput(value: unknown): value is DeviceConfigInput {
  return (
    isObjectLike(value) &&
    'host' in value &&
    typeof value.host === 'string' &&
    (!('port' in value) || typeof value.port === 'number')
  );
}

function isArrayOfDeviceConfigInput(
  value: unknown
): value is Array<DeviceConfigInput> {
  return (
    Array.isArray(value) && value.every((item) => isDeviceConfigInput(item))
  );
}

function isTplinkSmarthomeConfigInput(
  c: unknown
): c is TplinkSmarthomeConfigInput {
  return (
    isObjectLike(c) &&
    (!('addCustomCharacteristics' in c) ||
      typeof c.addCustomCharacteristics === 'boolean') &&
    (!('emeterPollingInterval' in c) ||
      typeof c.emeterPollingInterval === 'number') &&
    (!('inUseThreshold' in c) || typeof c.inUseThreshold === 'number') &&
    (!('switchModels' in c) || isArrayOfStrings(c.switchModels)) &&
    (!('discoveryPort' in c) || typeof c.discoveryPort === 'number') &&
    (!('broadcast' in c) || typeof c.broadcast === 'string') &&
    (!('pollingInterval' in c) || typeof c.pollingInterval === 'number') &&
    (!('deviceTypes' in c) || isArrayOfStrings(c.deviceTypes)) &&
    (!('macAddresses' in c) ||
      isArrayOfStrings(c.macAddresses) ||
      c.macAddresses === undefined) &&
    (!('excludeMacAddresses' in c) ||
      isArrayOfStrings(c.excludeMacAddresses) ||
      c.excludeMacAddresses === undefined) &&
    (!('devices' in c) ||
      isArrayOfDeviceConfigInput(c.devices) ||
      c.devices === undefined) &&
    (!('timeout' in c) || typeof c.timeout === 'number') &&
    (!('transport' in c) ||
      typeof c.transport === 'string' ||
      c.transport === undefined) &&
    (!('waitTimeUpdate' in c) || typeof c.waitTimeUpdate === 'number')
  );
}

export function parseConfig(
  config: Record<string, unknown>
): TplinkSmarthomeConfig {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  ajv.addVocabulary(['placeholder', 'titleMap']);
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const validate = ajv.compile(require('../config.schema.json').schema);
  const valid = validate(config);
  if (!valid)
    throw new ConfigParseError('Error parsing config', validate.errors);

  if (!isTplinkSmarthomeConfigInput(config))
    throw new ConfigParseError('Error parsing config');

  const c = defaults(config, defaultConfig);

  const defaultSendOptions = {
    timeout: c.timeout * 1000,
    transport: c.transport,
  };

  return {
    addCustomCharacteristics: Boolean(c.addCustomCharacteristics),
    emeterPollingInterval: c.emeterPollingInterval * 1000,
    switchModels: c.switchModels,

    waitTimeUpdate: c.waitTimeUpdate,

    defaultSendOptions,

    discoveryOptions: {
      port: c.discoveryPort,
      broadcast: c.broadcast,
      discoveryInterval: c.pollingInterval * 1000,
      devicesUseDiscoveryPort: c.devicesUseDiscoveryPort,
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
