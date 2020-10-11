import type {
  Characteristic as CharacteristicClass,
  WithUUID,
} from 'homebridge';

import DefaultCharacteristicImport from './default-characteristic';
import AmperesImport from './amperes';
import KilowattHoursImport from './kilowatt-hours';
import KilowattVoltAmpereHourImport from './kilowatt-volt-ampere-hour';
import VoltAmperesImport from './volt-amperes';
import VoltsImport from './volts';
import WattsImport from './watts';

export default function characteristic(
  Characteristic: typeof CharacteristicClass
): Record<
  | 'Amperes'
  | 'KilowattHours'
  | 'KilowattVoltAmpereHour'
  | 'VoltAmperes'
  | 'Volts'
  | 'Watts',
  WithUUID<new () => CharacteristicClass>
> {
  const DefaultCharacteristic = DefaultCharacteristicImport(Characteristic);

  return {
    Amperes: AmperesImport(DefaultCharacteristic),
    KilowattHours: KilowattHoursImport(DefaultCharacteristic),
    KilowattVoltAmpereHour: KilowattVoltAmpereHourImport(DefaultCharacteristic),
    VoltAmperes: VoltAmperesImport(DefaultCharacteristic),
    Volts: VoltsImport(DefaultCharacteristic),
    Watts: WattsImport(DefaultCharacteristic),
  };
}
