import type {
  CharacteristicGetCallback,
  CharacteristicProps,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logger,
} from 'homebridge';

import type TplinkSmarthomePlatform from '../platform';

import type { TplinkDevice } from '../utils';

export type CharacteristicConfig = {
  getValue?: () => Promise<Parameters<CharacteristicGetCallback>[1]>;
  setValue?: (value?: CharacteristicValue) => Promise<void>;
  props?: Partial<CharacteristicProps>;
  updateCallback?: (value: CharacteristicValue) => void;
};

export default abstract class HomeKitDevice {
  readonly log: Logger;

  characteristics: Record<string, CharacteristicConfig> = {};

  /**
   * Creates an instance of HomeKitDevice.
   */
  constructor(
    readonly platform: TplinkSmarthomePlatform,
    readonly tplinkDevice: TplinkDevice
  ) {
    this.log = platform.log;

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
      '[%s] getCharacteristicProps',
      this.name,
      this.platform.getCharacteristicName(characteristic)
    );
    return this.getCharacteristic(characteristic).props;
  }

  async getCharacteristicValue(characteristic: {
    UUID: string;
  }): Promise<unknown> {
    this.log.debug(
      '[%s] getCharacteristicValue',
      this.name,
      this.platform.getCharacteristicName(characteristic)
    );

    const c = this.getCharacteristic(characteristic);
    if (!('getValue' in c) || c.getValue === undefined) return undefined;
    return c.getValue();
  }

  async setCharacteristicValue(
    characteristic: { UUID: string },
    value: Parameters<CharacteristicSetCallback>[1]
  ): Promise<void> {
    this.log.debug(
      '[%s] setCharacteristicValue [%s]',
      this.name,
      value,
      this.platform.getCharacteristicName(characteristic)
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
      '[%s] fireCharacteristicUpdateCallback [%s]',
      this.name,
      value,
      this.platform.getCharacteristicName(characteristic)
    );
    const c = this.getCharacteristic(characteristic);
    if (c && typeof c.updateCallback === 'function') {
      c.updateCallback(value);
    }
  }

  setCharacteristicUpdateCallback(
    characteristic: { UUID: string },
    callbackFn: NonNullable<CharacteristicConfig['updateCallback']>
  ): void {
    this.log.debug(
      '[%s] setCharacteristicUpdateCallback [%s]',
      this.name,
      this.platform.getCharacteristicName(characteristic),
      callbackFn.name
    );
    const c = this.getCharacteristic(characteristic);
    if (c && typeof c.updateCallback === 'function') {
      this.getCharacteristic(characteristic).updateCallback = callbackFn;
    }
  }
}
