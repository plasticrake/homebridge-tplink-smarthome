import type { Characteristic, WithUUID } from 'homebridge';

export default function kilowattHours(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class KilowattHours extends DefaultCharacteristic {
    static readonly UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-expect-error no format, no perms
      super('Total Consumption', KilowattHours.UUID, {
        unit: 'kWh',
        minStep: 0.001,
      });
    }
  };
}
