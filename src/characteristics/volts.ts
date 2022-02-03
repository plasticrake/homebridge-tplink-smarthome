import type { WithUUID } from 'homebridge';
import DefaultCharacteristicClass from './types';

export default function volts(
  DefaultCharacteristic: typeof DefaultCharacteristicClass
): WithUUID<new () => DefaultCharacteristicClass> {
  return class Volts extends DefaultCharacteristic {
    static readonly UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Volts', Volts.UUID, {
        unit: 'V',
        minStep: 0.1,
      });
    }
  };
}
