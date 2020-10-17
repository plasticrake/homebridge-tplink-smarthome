// homebridge import is a const enum and not an actual import
// eslint-disable-next-line import/no-extraneous-dependencies
import { PlatformAccessoryEvent } from 'homebridge';

import type {
  Categories,
  Characteristic,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';

import create from './homekit-device/create';

import AccessoryInformation from './accessory-information';
import { TplinkSmarthomeConfig } from './config';
import HomekitDevice from './homekit-device';
import type TplinkSmarthomePlatform from './platform';
import { callbackify, getOrAddCharacteristic } from './utils';
import type { TplinkDevice } from './utils';

export default class TplinkAccessory {
  readonly homebridgeAccessory: PlatformAccessory;

  private readonly log: Logging;

  private readonly hkDevice: HomekitDevice;

  private readonly services: Record<string, Service> = {};

  private readonly name: string;

  constructor(
    private readonly platform: TplinkSmarthomePlatform,
    private readonly config: TplinkSmarthomeConfig,
    homebridgeAccessory: PlatformAccessory | undefined,
    tplinkDevice: TplinkDevice,
    category: Categories,
    services: Array<WithUUID<typeof Service>>
  ) {
    const CustomCharacteristic = platform.customCharacteristics;

    this.log = platform.log;

    this.hkDevice = create(platform, tplinkDevice, category);

    this.name = this.hkDevice.name;

    const categoryName = platform.getCategoryName(category);

    if (homebridgeAccessory !== undefined) {
      this.homebridgeAccessory = homebridgeAccessory;

      this.log.debug(
        `[${this.name}] Existing Accessory found [${
          homebridgeAccessory.context.deviceId
        }] [${homebridgeAccessory.UUID}] category: ${categoryName || ''}`
      );
      this.homebridgeAccessory.displayName = this.name;
      if (this.homebridgeAccessory.category !== category) {
        this.log.warn(
          `[${
            this.name
          }] Correcting Accessory Category from: ${platform.getCategoryName(
            this.homebridgeAccessory.category
          )} to: ${categoryName || ''}`
        );
        this.homebridgeAccessory.category = category;
      }
    } else {
      const uuid = platform.api.hap.uuid.generate(this.hkDevice.id);
      this.log.debug(
        `[${this.name}] Creating new Accessory [${
          this.hkDevice.id
        }] [${uuid}] category: ${categoryName || ''}`
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
    this.homebridgeAccessory.on(
      PlatformAccessoryEvent.IDENTIFY,
      this.hkDevice.identify
    );

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
        this.log.debug(`[${this.name}] Creating new ${serviceName} Service`);
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
      const characteristics: Array<WithUUID<
        WithUUID<new () => Characteristic>
      >> = [this.platform.Characteristic.Name, this.platform.Characteristic.On];

      const { Accessory } = platform.api.hap;

      if (category === Accessory.Categories.OUTLET) {
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
        `[${this.name}] Removing stale Service: [%s] uuid:[%s] subtype:[%s]`,
        this.platform.getServiceName(service),
        service.UUID,
        service.subtype || ''
      );
      this.homebridgeAccessory.removeService(service);
    });
  }

  private callbackify<T>(
    func: (...args: unknown[]) => Promise<T>
  ): (error?: Error | null | undefined, value?: T | undefined) => void {
    return callbackify(func.bind(this), (reason: unknown) => {
      this.log.error('[%s] %s', this.name, func.name);
      this.log.error(String(reason));
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
        `[${this.name}] Removing stale Characteristic: [%s.%s] uuid:[%s]`,
        this.platform.getServiceName(service),
        this.platform.getCharacteristicName(characteristicToRemove),
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

        characteristic.on(
          'get',
          this.callbackify(() => {
            return this.hkDevice.getCharacteristicValue(characteristic);
          })
        );

        if (this.hkDevice.supportsCharacteristicSet(characteristic)) {
          characteristic.on(
            'set',
            this.callbackify((value) => {
              return this.hkDevice.setCharacteristicValue(
                characteristic,
                value as CharacteristicValue // TODO: refactor
              );
            })
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
