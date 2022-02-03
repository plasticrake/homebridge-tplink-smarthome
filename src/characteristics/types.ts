import type {
  Characteristic as CharacteristicClass,
  CharacteristicProps,
} from 'homebridge';
import type { MarkOptional } from 'ts-essentials';

declare class DefaultCharacteristicClass extends CharacteristicClass {
  constructor(
    displayName: string,
    UUID: string,
    props?: MarkOptional<CharacteristicProps, 'format' | 'perms'>
  );
}

export default DefaultCharacteristicClass;
