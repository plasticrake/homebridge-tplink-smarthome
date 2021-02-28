import type { Characteristic, WithUUID } from 'homebridge';

export default function voltAmperes(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class VoltAmperes extends DefaultCharacteristic {
    static readonly UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-ignore: unable to override class constructor parameters as its a type and not a value
      super('Apparent Power', VoltAmperes.UUID, {
        // @ts-ignore: custom unit
        unit: 'VA',
        minStep: 0.1,
      });
    }
  };
}
