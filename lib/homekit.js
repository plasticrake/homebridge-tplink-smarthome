const inherits = require('util').inherits;

module.exports = function (homebridge) {
  const Characteristic = homebridge.hap.Characteristic;

  const CustomCharacteristic = {};

  CustomCharacteristic.Volts = function () {
    Characteristic.call(this, 'Volts', CustomCharacteristic.Volts.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'V',
      minValue: 0,
      maxValue: 65535,
      minStep: 0.1,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.Volts.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.Volts, Characteristic);

  CustomCharacteristic.Amperes = function () {
    Characteristic.call(this, 'Amps', CustomCharacteristic.Amperes.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'A',
      minValue: 0,
      maxValue: 65535,
      minStep: 0.01,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.Amperes.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.Amperes, Characteristic);

  CustomCharacteristic.Watts = function () {
    Characteristic.call(this, 'Consumption', CustomCharacteristic.Watts.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 65535,
      minStep: 0.1,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.Watts.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.Watts, Characteristic);

  CustomCharacteristic.VoltAmperes = function () {
    Characteristic.call(this, 'Apparent Power', CustomCharacteristic.VoltAmperes.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT16,
      unit: 'VA',
      minValue: 0,
      maxValue: 65535,
      minStep: 1,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.VoltAmperes.UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.VoltAmperes, Characteristic);

  CustomCharacteristic.KilowattHours = function () {
    Characteristic.call(this, 'Total Consumption', CustomCharacteristic.KilowattHours.UUID);
    this.setProps({
      format: Characteristic.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 65535,
      minStep: 0.001,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.KilowattHours.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.KilowattHours, Characteristic);

  CustomCharacteristic.KilowattVoltAmpereHour = function () {
    Characteristic.call(this, 'Apparent Energy', CustomCharacteristic.KilowattVoltAmpereHour.UUID);
    this.setProps({
      format: Characteristic.Formats.UINT32,
      unit: 'kVAh',
      minValue: 0,
      maxValue: 65535,
      minStep: 1,
      perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
    });
    this.value = this.getDefaultValue();
  };
  CustomCharacteristic.KilowattVoltAmpereHour.UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';
  inherits(CustomCharacteristic.KilowattVoltAmpereHour, Characteristic);

  return {CustomCharacteristic};
};
