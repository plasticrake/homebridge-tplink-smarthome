import type {
  Characteristic as CharacteristicClass,
  CharacteristicProps,
} from 'homebridge';
import type { MarkOptional } from 'ts-essentials';

export default function defaultCharacteristic(
  Characteristic: typeof CharacteristicClass
): typeof CharacteristicClass {
  return class DefaultCharacteristic extends Characteristic {
    constructor(
      displayName: string,
      UUID: string,
      props?: MarkOptional<CharacteristicProps, 'format' | 'perms'>
    ) {
      const combinedProps = {
        format: Characteristic.Formats.FLOAT,
        minValue: 0,
        maxValue: 65535,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        ...props,
      };
      super(displayName, UUID, combinedProps);
      this.value = this.getDefaultValue();
    }
  };
}
