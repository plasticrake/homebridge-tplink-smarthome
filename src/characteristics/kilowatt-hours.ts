import type { WithUUID } from 'homebridge';
import type DefaultCharacteristicClass from './types';

export default function kilowattHours(
  DefaultCharacteristic: typeof DefaultCharacteristicClass
): WithUUID<new () => DefaultCharacteristicClass> {
  return class KilowattHours extends DefaultCharacteristic {
    static readonly UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Total Consumption', KilowattHours.UUID, {
        unit: 'kWh',
        minStep: 0.001,
      });
    }
  };
}
