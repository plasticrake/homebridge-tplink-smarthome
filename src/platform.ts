// eslint-disable-next-line import/no-extraneous-dependencies
import { APIEvent, Categories } from 'homebridge'; // enum
import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
  WithUUID,
} from 'homebridge';

import chalk from 'chalk';
import { satisfies } from 'semver';
import { Client } from 'tplink-smarthome-api';
import type { Sysinfo } from 'tplink-smarthome-api';

import { parseConfig } from './config';
import type { TplinkSmarthomeConfig } from './config';
import Characteristics from './characteristics';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { lookup, lookupCharacteristicNameByUUID, isObjectLike } from './utils';
import type { TplinkDevice } from './utils';
import create from './homekit-device/create';
import HomekitDevice from './homekit-device';

// okay for reading json
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageConfig = require('../package.json');

export type TplinkSmarthomeAccessoryContext = {
  deviceId?: string;
};

export default class TplinkSmarthomePlatform implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service;

  public readonly Characteristic = this.api.hap.Characteristic;

  public customCharacteristics: ReturnType<typeof Characteristics>;

  public config: TplinkSmarthomeConfig;

  private readonly configuredAccessories: Map<
    string,
    PlatformAccessory<TplinkSmarthomeAccessoryContext>
  > = new Map();

  private readonly homekitDevicesById: Map<string, HomekitDevice> = new Map();

  constructor(
    public readonly log: Logging,
    config: PlatformConfig,
    public readonly api: API
  ) {
    this.log.info(
      '%s v%s, node %s, homebridge v%s, api v%s',
      packageConfig.name,
      packageConfig.version,
      process.version,
      api.serverVersion,
      api.version
    );
    if (!satisfies(process.version, packageConfig.engines.node)) {
      this.log.error(
        'Error: not using minimum node version %s',
        packageConfig.engines.node
      );
    }
    if (
      api.versionGreaterOrEqual == null ||
      !api.versionGreaterOrEqual('1.3.0')
    ) {
      this.log.error(
        `homebridge-tplink-smarthome requires homebridge >= 1.3.0. Currently running: ${api.serverVersion}`
      );
      throw new Error(
        `homebridge-tplink-smarthome requires homebridge >= 1.3.0. Currently running: ${api.serverVersion}`
      );
    }

    this.log.debug('config.json: %j', config);
    this.config = parseConfig(config);
    this.log.debug('config: %j', this.config);

    this.customCharacteristics = Characteristics(api.hap.Characteristic);

    const tplinkApiLogger: Logging = Object.assign(() => {}, this.log, {
      prefix: `${this.log.prefix || PLATFORM_NAME}.API`,
    });

    const client = new Client({
      logger: tplinkApiLogger,
      defaultSendOptions: this.config.defaultSendOptions,
    });

    client.on('device-new', (device: TplinkDevice) => {
      this.log.info(
        `Device First Online: ${chalk.blue(`[${device.alias}]`)} %s [%s]`,
        device.deviceType,
        device.id,
        device.host,
        device.port
      );
      this.foundDevice(device);
    });

    client.on('device-online', (device: TplinkDevice) => {
      this.log.debug(
        `Device Online: ${chalk.blue(`[${device.alias}]`)} %s [%s]`,
        device.deviceType,
        device.id,
        device.host,
        device.port
      );
      this.foundDevice(device);
    });

    client.on('device-offline', (device: TplinkDevice) => {
      const deviceAccessory = this.homekitDevicesById.get(device.id);

      if (deviceAccessory !== undefined) {
        this.log.debug(
          `Device Offline: ${chalk.blue(`[${device.alias}]`)} %s [%s]`,
          deviceAccessory.homebridgeAccessory.displayName,
          device.deviceType,
          device.id,
          device.host,
          device.port
        );
      }
    });

    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.debug(APIEvent.DID_FINISH_LAUNCHING);

      client.startDiscovery({
        ...this.config.discoveryOptions,
        filterCallback: (si: Sysinfo) => {
          return si.deviceId != null && si.deviceId.length > 0;
        },
      });

      const refreshEmeterForAccessories = async (
        accessories: HomekitDevice[]
      ) => {
        for (const acc of accessories) {
          const device = acc.tplinkDevice;
          if (device.deviceType === 'plug' && device.supportsEmeter) {
            this.log.debug(
              `getEmeterRealtime ${chalk.blue(`[${device.alias}]`)}`
            );
            // eslint-disable-next-line no-await-in-loop
            await device.emeter.getRealtime().catch((reason) => {
              this.log.error('[%s] %s', device.alias, 'emeter.getRealtime()');
              this.log.error(reason);
            });
          }
        }
      };

      const refreshEmeter = async () => {
        this.log.debug('refreshEmeter()');
        try {
          const deviceAccessories = this.deviceAccessoriesByHost;
          const promises: Promise<unknown>[] = [];

          for (const accForHost of deviceAccessories.values()) {
            promises.push(refreshEmeterForAccessories(accForHost));
          }
          await Promise.all(promises);
        } catch (err) {
          this.log.error('refreshEmeter()');
          this.log.error(String(err));
        } finally {
          this.log.debug(
            'Scheduling next run of refreshEmeter() in %d(ms)',
            this.config.discoveryOptions.discoveryInterval
          );
          setTimeout(() => {
            refreshEmeter();
          }, this.config.discoveryOptions.discoveryInterval);
        }
      };

      refreshEmeter();
    });

    this.api.on('shutdown', () => {
      this.log.debug('shutdown');
      client.stopDiscovery();
    });
  }

  /**
   * Return string representation of Service/Characteristic for logging
   *
   * @internal
   */
  public lsc(
    serviceOrCharacteristic: Service | Characteristic | { UUID: string },
    characteristic?: Characteristic | { UUID: string }
  ): string {
    let serviceName: string | undefined;
    let characteristicName: string | undefined;

    if (serviceOrCharacteristic instanceof this.api.hap.Service) {
      serviceName = this.getServiceName(serviceOrCharacteristic);
    } else if (
      serviceOrCharacteristic instanceof this.api.hap.Characteristic ||
      ('UUID' in serviceOrCharacteristic &&
        typeof serviceOrCharacteristic.UUID === 'string')
    ) {
      characteristicName = this.getCharacteristicName(serviceOrCharacteristic);
    }

    if (characteristic instanceof this.api.hap.Characteristic) {
      characteristicName = this.getCharacteristicName(characteristic);
    }

    if (serviceName != null && characteristicName != null) {
      return `[${chalk.yellow(serviceName)}.${chalk.green(
        characteristicName
      )}]`;
    }
    if (serviceName !== undefined) return `[${chalk.yellow(serviceName)}]`;
    return `[${chalk.green(characteristicName)}]`;
  }

  private get deviceAccessoriesByHost(): Map<string, HomekitDevice[]> {
    const byHost: Map<string, HomekitDevice[]> = new Map();
    for (const [, tpLinkAccessory] of this.homekitDevicesById) {
      const { host } = tpLinkAccessory.tplinkDevice;
      const arr = byHost.get(host);
      if (arr != null) {
        arr.push(tpLinkAccessory);
      } else {
        byHost.set(host, [tpLinkAccessory]);
      }
    }
    return byHost;
  }

  private createHomekitDevice(
    accessory: PlatformAccessory<TplinkSmarthomeAccessoryContext> | undefined,
    tplinkDevice: TplinkDevice
  ): HomekitDevice {
    return create(this, this.config, accessory, tplinkDevice);
  }

  getCategoryName(category: Categories): string | undefined {
    // @ts-expect-error: this should work
    // eslint-disable-next-line deprecation/deprecation
    return this.api.hap.Accessory.Categories[category];
  }

  getServiceName(service: { UUID: string }): string | undefined {
    return lookup(
      this.api.hap.Service,
      (thisKeyValue, value) =>
        isObjectLike(thisKeyValue) &&
        'UUID' in thisKeyValue &&
        thisKeyValue.UUID === value,
      service.UUID
    );
  }

  getCharacteristicName(
    characteristic: WithUUID<{ name?: string; displayName?: string }>
  ): string | undefined {
    if ('name' in characteristic && characteristic.name !== undefined)
      return characteristic.name;
    if (
      'displayName' in characteristic &&
      characteristic.displayName !== undefined
    )
      return characteristic.displayName;

    if ('UUID' in characteristic) {
      return lookupCharacteristicNameByUUID(
        this.api.hap.Characteristic,
        characteristic.UUID
      );
    }
    return undefined;
  }

  /**
   * Registers a Homebridge PlatformAccessory.
   *
   * Calls {@link external:homebridge.API#registerPlatformAccessories}
   */
  registerPlatformAccessory(
    platformAccessory: PlatformAccessory<TplinkSmarthomeAccessoryContext>
  ): void {
    this.log.debug(
      `registerPlatformAccessory(${chalk.blue(
        `[${platformAccessory.displayName}]`
      )})`
    );
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      platformAccessory,
    ]);
  }

  /**
   * Function invoked when homebridge tries to restore cached accessory
   */
  configureAccessory(
    accessory: PlatformAccessory<TplinkSmarthomeAccessoryContext>
  ): void {
    this.log.info(
      `Configuring cached accessory: ${chalk.blue(
        `[${accessory.displayName}]`
      )} UUID: ${accessory.UUID} deviceId: %s `,
      accessory.context?.deviceId
    );
    this.log.debug('%O', accessory.context);

    this.configuredAccessories.set(accessory.UUID, accessory);
  }

  /**
   * Adds a new or existing real device.
   */
  private foundDevice(device: TplinkDevice): void {
    const deviceId = device.id;

    if (deviceId == null || deviceId.length === 0) {
      this.log.error('Missing deviceId: %s', device.host);
      return;
    }

    if (this.homekitDevicesById.get(deviceId) !== undefined) {
      return;
    }

    this.log.info(
      `Adding: ${chalk.blue(`[${device.alias}]`)} %s [%s]`,
      device.deviceType,
      deviceId
    );

    const uuid = this.api.hap.uuid.generate(deviceId);
    const accessory = this.configuredAccessories.get(uuid);

    this.homekitDevicesById.set(
      device.id,
      this.createHomekitDevice(accessory, device)
    );
  }
}
