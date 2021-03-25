// eslint-disable-next-line import/no-extraneous-dependencies
import { Categories, PlatformAccessoryEvent } from 'homebridge'; // enum

import type {
  Characteristic,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';

import chalk from 'chalk';

import create from './homekit-device/create';

import AccessoryInformation from './accessory-information';
import { TplinkSmarthomeConfig } from './config';
import HomekitDevice from './homekit-device';
import type TplinkSmarthomePlatform from './platform';
import { getOrAddCharacteristic, prefixLogger } from './utils';
import type { TplinkDevice } from './utils';

export default class TplinkAccessory {
  readonly homebridgeAccessory: PlatformAccessory;

  private readonly log: Logging;

  private readonly hkDevice: HomekitDevice;

  private readonly services: Record<string, Service> = {};

  private readonly name: string;

  private lsc: (
    serviceOrCharacteristic: Service | Characteristic | { UUID: string },
    characteristic?: Characteristic | { UUID: string }
  ) => string;

  constructor(
    private readonly platform: TplinkSmarthomePlatform,
    private readonly config: TplinkSmarthomeConfig,
    homebridgeAccessory: PlatformAccessory | undefined,
    public tplinkDevice: TplinkDevice,
    category: Categories,
    services: Array<WithUUID<typeof Service>>
  ) {
    const CustomCharacteristic = platform.customCharacteristics;

    this.hkDevice = create(platform, tplinkDevice, category);

    this.name = this.hkDevice.name;

    this.log = prefixLogger(
      platform.log,
      () => `${chalk.blue(`[${this.name}]`)}`
    );

    this.lsc = this.platform.lsc.bind(this.platform);

    const categoryName = platform.getCategoryName(category) ?? '';

    if (homebridgeAccessory !== undefined) {
      this.homebridgeAccessory = homebridgeAccessory;

      this.log.debug(
        `Existing Accessory found [${homebridgeAccessory.context.deviceId}] [${homebridgeAccessory.UUID}] category: ${categoryName}`
      );
      this.homebridgeAccessory.displayName = this.name;
      if (this.homebridgeAccessory.category !== category) {
        this.log.warn(
          `Correcting Accessory Category from: ${platform.getCategoryName(
            this.homebridgeAccessory.category
          )} to: ${categoryName}`
        );
        this.homebridgeAccessory.category = category;
      }
    } else {
      const uuid = platform.api.hap.uuid.generate(this.hkDevice.id);
      this.log.debug(
        `Creating new Accessory [${this.hkDevice.id}] [${uuid}] category: ${categoryName}`
      );
      // eslint-disable-next-line new-cap
      this.homebridgeAccessory = new platform.api.platformAccessory(
        this.name,
        uuid,
        category
      );
      this.platform.registerPlatformAccessory(this.homebridgeAccessory);
    }

    const accInfo = AccessoryInformation(platform.api.hap)(
      this.homebridgeAccessory,
      this.hkDevice
    );
    if (accInfo !== undefined) {
      this.services.AccessoryInformation = accInfo;
    } else {
      this.log.error('Could not retrieve default AccessoryInformation');
    }

    this.homebridgeAccessory.context.deviceId = this.hkDevice.id;
    this.homebridgeAccessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.hkDevice.identify();
    });

    services.forEach((serviceConstructor) => {
      const serviceName = this.platform.getServiceName(serviceConstructor);

      if (serviceName === undefined) {
        this.log.error(
          'Could not find service name for UUID:',
          serviceConstructor.UUID
        );
        return;
      }

      let service = this.homebridgeAccessory.getService(serviceConstructor);
      if (!service) {
        this.log.debug(`Creating new ${serviceName} Service`);
        service = this.homebridgeAccessory.addService(
          serviceConstructor,
          this.name
        );
      } else {
        service.setCharacteristic(this.platform.Characteristic.Name, this.name);
      }

      this.services[serviceName] = service;
    });

    if (this.services.Outlet) {
      const characteristics: Array<
        WithUUID<WithUUID<new () => Characteristic>>
      > = [this.platform.Characteristic.Name, this.platform.Characteristic.On];

      if (category === Categories.OUTLET) {
        characteristics.push(this.platform.Characteristic.OutletInUse);
      }

      if (this.config.addCustomCharacteristics) {
        characteristics.push(
          ...[
            CustomCharacteristic.Amperes,
            CustomCharacteristic.KilowattHours,
            CustomCharacteristic.VoltAmperes,
            CustomCharacteristic.Volts,
            CustomCharacteristic.Watts,
          ]
        );
      }
      this.setupCharacteristics(this.services.Outlet, characteristics);
    }

    if (this.services.Switch) {
      this.setupCharacteristics(this.services.Switch, [
        this.platform.Characteristic.Name,
        this.platform.Characteristic.On,
      ]);
    }

    if (this.services.Lightbulb) {
      const characteristics: Array<WithUUID<new () => Characteristic>> = [
        this.platform.Characteristic.Name,
        this.platform.Characteristic.On,
        this.platform.Characteristic.Brightness,
        this.platform.Characteristic.ColorTemperature,
        this.platform.Characteristic.Hue,
        this.platform.Characteristic.Saturation,
      ];
      if (this.config.addCustomCharacteristics) {
        characteristics.push(CustomCharacteristic.Watts);
      }
      this.setupCharacteristics(this.services.Lightbulb, characteristics);
    }

    // Remove Old Services
    this.homebridgeAccessory.services.forEach((service) => {
      if (service === this.services.AccessoryInformation) return;
      if (service === this.services.Lightbulb) return;
      if (service === this.services.Outlet) return;
      if (service === this.services.Switch) return;
      this.log.warn(
        `Removing stale Service: ${this.lsc(service)} uuid:[%s] subtype:[%s]`,
        service.UUID,
        service.subtype || ''
      );
      this.homebridgeAccessory.removeService(service);
    });
  }

  private setupCharacteristics(
    service: Service,
    characteristicTypes: Array<WithUUID<new () => Characteristic>>
  ) {
    const characteristicsToRemove = service.characteristics.filter(
      (existingCharacteristic) => {
        return !characteristicTypes.find(
          (characteristicToSetup) =>
            characteristicToSetup.UUID === existingCharacteristic.UUID
        );
      }
    );

    characteristicsToRemove.forEach((characteristicToRemove) => {
      this.log.warn(
        `Removing stale Characteristic: ${this.lsc(
          service,
          characteristicToRemove
        )} uuid:[%s]`,
        characteristicToRemove.UUID
      );
      service.removeCharacteristic(characteristicToRemove);
    });

    characteristicTypes.forEach((CharacteristicType) => {
      if (this.hkDevice.supportsCharacteristic(CharacteristicType)) {
        const characteristic = getOrAddCharacteristic(
          service,
          CharacteristicType
        );

        const props = this.hkDevice.getCharacteristicProps(characteristic);
        if (props) {
          characteristic.setProps(props);
        }

        characteristic.on('get', (callback: CharacteristicGetCallback) => {
          this.log.debug(`get ${this.lsc(characteristic)}`);

          this.hkDevice
            .getCharacteristicValue(characteristic)
            .then((value) => {
              callback(null, value);
            })
            .catch((err) => {
              this.log.error(`get ${this.lsc(characteristic)}`);
              this.log.error(String(err));
              callback(err);
            });
        });

        if (this.hkDevice.supportsCharacteristicSet(characteristic)) {
          characteristic.on(
            'set',
            (
              value: CharacteristicValue,
              callback: CharacteristicSetCallback
            ) => {
              this.log.debug(`set ${this.lsc(characteristic)} %s`, value);

              this.hkDevice
                .setCharacteristicValue(characteristic, value)
                .then(() => {
                  callback(null);
                })
                .catch((err) => {
                  this.log.error(`set ${this.lsc(characteristic)}`);
                  this.log.error(String(err));
                  callback(err);
                });
            }
          );
        }

        this.hkDevice.setCharacteristicUpdateCallback(
          characteristic,
          (value) => {
            characteristic.updateValue(value);
          }
        );
        return;
      }
      // Remove unsupported characteristic
      service.removeCharacteristic(
        service.getCharacteristic(CharacteristicType)
      );
    });
  }
}
