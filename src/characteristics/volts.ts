import type { Characteristic, WithUUID } from 'homebridge';

export default function volts(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class Volts extends DefaultCharacteristic {
    static readonly UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Volts', Volts.UUID, {
        // @ts-ignore: custom unit
        unit: 'V',
        minStep: 0.1,
      });
    }
  };
}
