import type { WithUUID } from 'homebridge';
import DefaultCharacteristicClass from './types';

export default function amperes(
  DefaultCharacteristic: typeof DefaultCharacteristicClass
): WithUUID<new () => DefaultCharacteristicClass> {
  return class Amperes extends DefaultCharacteristic {
    static readonly UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Amperes', Amperes.UUID, {
        unit: 'A',
        minStep: 0.01,
      });
    }
  };
}
