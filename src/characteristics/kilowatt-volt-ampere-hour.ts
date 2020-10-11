import type { Characteristic, WithUUID } from 'homebridge';

export default function kilowattVoltAmpereHours(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class KilowattVoltAmpereHour extends DefaultCharacteristic {
    static readonly UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      super('Apparent Energy', KilowattVoltAmpereHour.UUID, {
        format: DefaultCharacteristic.Formats.UINT32,
        // @ts-ignore: custom unit
        unit: 'kVAh',
        minStep: 1,
      });
    }
  };
}
