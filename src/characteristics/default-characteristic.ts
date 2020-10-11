import type {
  Characteristic as CharacteristicClass,
  CharacteristicProps,
} from 'homebridge';

export default function defaultCharacteristic(
  Characteristic: typeof CharacteristicClass
): typeof CharacteristicClass {
  return class DefaultCharacteristic extends Characteristic {
    constructor(
      displayName: string,
      UUID: string,
      props?: CharacteristicProps
    ) {
      super(displayName, UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        minValue: 0,
        maxValue: 65535,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        ...props,
      });
      this.value = this.getDefaultValue();
    }
  };
}
