import type { Characteristic, WithUUID } from 'homebridge';

export default function voltAmperes(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class VoltAmperes extends DefaultCharacteristic {
    static readonly UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Apparent Power', VoltAmperes.UUID, {
        format: DefaultCharacteristic.Formats.UINT16,
        // @ts-ignore: custom unit
        unit: 'VA',
        minStep: 1,
      });
    }
  };
}
