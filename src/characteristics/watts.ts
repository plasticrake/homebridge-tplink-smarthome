import type { Characteristic, WithUUID } from 'homebridge';

export default function watts(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class Watts extends DefaultCharacteristic {
    static readonly UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-ignore: unable to override class constructor parameters as its a type and not a value
      super('Consumption', Watts.UUID, {
        // @ts-ignore: custom unit
        unit: 'W',
        minStep: 0.1,
      });
    }
  };
}
