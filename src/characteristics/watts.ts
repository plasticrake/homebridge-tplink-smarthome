import type { Characteristic, WithUUID } from 'homebridge';

export default function watts(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class Watts extends DefaultCharacteristic {
    static readonly UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-expect-error no format, no perms
      super('Consumption', Watts.UUID, {
        unit: 'W',
        minStep: 0.1,
      });
    }
  };
}
