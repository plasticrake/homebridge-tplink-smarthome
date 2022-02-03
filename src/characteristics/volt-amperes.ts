import type { WithUUID } from 'homebridge';
import DefaultCharacteristicClass from './types';

export default function voltAmperes(
  DefaultCharacteristic: typeof DefaultCharacteristicClass
): WithUUID<new () => DefaultCharacteristicClass> {
  return class VoltAmperes extends DefaultCharacteristic {
    static readonly UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Apparent Power', VoltAmperes.UUID, {
        unit: 'VA',
        minStep: 0.1,
      });
    }
  };
}
