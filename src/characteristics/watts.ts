import type { WithUUID } from 'homebridge';
import DefaultCharacteristicClass from './types';

export default function watts(
  DefaultCharacteristic: typeof DefaultCharacteristicClass
): WithUUID<new () => DefaultCharacteristicClass> {
  return class Watts extends DefaultCharacteristic {
    static readonly UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Consumption', Watts.UUID, {
        unit: 'W',
        minStep: 0.1,
      });
    }
  };
}
