import type { Characteristic, WithUUID } from 'homebridge';

export default function amperes(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class Amperes extends DefaultCharacteristic {
    static readonly UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-ignore: unable to override class constructor parameters as its a type and not a value
      super('Amperes', Amperes.UUID, {
        // @ts-ignore: custom unit
        unit: 'A',
        minStep: 0.01,
      });
    }
  };
}
