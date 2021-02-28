import type { Characteristic, WithUUID } from 'homebridge';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Formats } from 'homebridge'; // enum

export default function kilowattVoltAmpereHours(
  DefaultCharacteristic: typeof Characteristic
): WithUUID<new () => Characteristic> {
  return class KilowattVoltAmpereHour extends DefaultCharacteristic {
    static readonly UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';

    constructor() {
      // @ts-ignore: unable to override class constructor parameters as its a type and not a value
      super('Apparent Energy', KilowattVoltAmpereHour.UUID, {
        format: Formats.UINT32,
        // @ts-ignore: custom unit
        unit: 'kVAh',
        minStep: 1,
      });
    }
  };
}
