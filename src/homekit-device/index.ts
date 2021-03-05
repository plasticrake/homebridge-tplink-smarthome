import type {
  Categories,
  Characteristic,
  CharacteristicProps,
  CharacteristicValue,
  Logger,
  Nullable,
  Service,
} from 'homebridge';

import chalk from 'chalk';

import type TplinkSmarthomePlatform from '../platform';
import type { TplinkDevice } from '../utils';
import { prefixLogger } from '../utils';

export type CharacteristicConfig = {
  getValue?: () => Promise<Nullable<CharacteristicValue>>;
  setValue?: (value: CharacteristicValue) => Promise<void>;
  props?: Partial<CharacteristicProps>;
  updateCallback?: (value: CharacteristicValue) => void;
};

export default abstract class HomeKitDevice {
  readonly log: Logger;

  characteristics: Record<string, CharacteristicConfig> = {};

  private lsc: (
    serviceOrCharacteristic: Service | Characteristic | { UUID: string },
    characteristic?: Characteristic | { UUID: string }
  ) => string;

  /**
   * Creates an instance of HomeKitDevice.
   */
  constructor(
    readonly platform: TplinkSmarthomePlatform,
    readonly tplinkDevice: TplinkDevice,
    readonly category: Categories
  ) {
    this.log = prefixLogger(
      platform.log,
      () => `${chalk.blue(`[${this.name}]`)}`
    );

    this.lsc = this.platform.lsc.bind(this.platform);

    this.addCharacteristic(platform.Characteristic.Name, {
      getValue: async () => {
        return this.name;
      },
    });
  }

  get id(): string {
    return this.tplinkDevice.id;
  }

  get name(): string {
    return this.tplinkDevice.alias;
  }

  // eslint-disable-next-line class-methods-use-this
  get manufacturer(): string {
    return 'TP-Link';
  }

  get model(): string {
    return this.tplinkDevice.model;
  }

  get serialNumber(): string {
    return `${this.tplinkDevice.mac} ${this.tplinkDevice.id}`;
  }

  get firmwareRevision(): string {
    return this.tplinkDevice.softwareVersion;
  }

  get hardwareRevision(): string {
    return this.tplinkDevice.hardwareVersion;
  }

  abstract identify(): void;

  supportsCharacteristic(characteristic: { UUID: string }): boolean {
    return this.getCharacteristic(characteristic) !== undefined;
  }

  supportsCharacteristicSet(characteristic: { UUID: string }): boolean {
    const c = this.getCharacteristic(characteristic);
    if (c === undefined) return false;
    return typeof c.setValue === 'function';
  }

  addCharacteristic(
    characteristic: { UUID: string },
    config: CharacteristicConfig
  ): void {
    this.characteristics[characteristic.UUID] = config;
  }

  private getCharacteristic(characteristic: {
    UUID: string;
  }): CharacteristicConfig {
    return this.characteristics[characteristic.UUID];
  }

  getCharacteristicProps(characteristic: {
    UUID: string;
  }): CharacteristicConfig['props'] {
    this.log.debug(
      'getCharacteristicProps',
      this.lsc(characteristic as Characteristic)
    );
    return this.getCharacteristic(characteristic).props;
  }

  async getCharacteristicValue(characteristic: {
    UUID: string;
  }): Promise<Nullable<CharacteristicValue>> {
    this.log.debug(
      `getCharacteristicValue ${this.lsc(characteristic as Characteristic)}`
    );

    const c = this.getCharacteristic(characteristic);
    if (!('getValue' in c) || c.getValue === undefined) return null;
    return c.getValue();
  }

  async setCharacteristicValue(
    characteristic: { UUID: string },
    value: CharacteristicValue
  ): Promise<void> {
    this.log.debug(
      'setCharacteristicValue %s %s',
      this.lsc(characteristic as Characteristic),
      value
    );

    const c = this.getCharacteristic(characteristic);
    if (!('setValue' in c) || c.setValue === undefined) return undefined;
    return c.setValue(value);
  }

  fireCharacteristicUpdateCallback(
    characteristic: { UUID: string },
    value: CharacteristicValue
  ): void {
    this.log.debug(
      `fireCharacteristicUpdateCallback ${this.lsc(
        characteristic as Characteristic
      )} %s`,
      value
    );
    const c = this.getCharacteristic(characteristic);
    if (c && typeof c.updateCallback === 'function') {
      c.updateCallback(value);
      return;
    }

    // Characteristic may not be setup on device (e.g. addCustomCharacteristics is false)
    // Warn if characteristic exists, but do not warn if characteristic does not exist
    if (c) {
      this.log.warn(
        `fireCharacteristicUpdateCallback ${this.lsc(
          characteristic
        )}: Unable to call updateCallback`
      );
    } else {
      this.log.debug(
        `fireCharacteristicUpdateCallback [${this.lsc(
          characteristic
        )}]: Unable to call updateCallback`
      );
    }
  }

  setCharacteristicUpdateCallback(
    characteristic: { UUID: string },
    callbackFn: NonNullable<CharacteristicConfig['updateCallback']>
  ): void {
    this.log.debug(
      `setCharacteristicUpdateCallback ${this.lsc(characteristic)}`,
      callbackFn.name
    );
    const c = this.getCharacteristic(characteristic);
    c.updateCallback = callbackFn;
  }

  protected logRejection(reason: unknown): void {
    this.log.error(JSON.stringify(reason));
  }
}
