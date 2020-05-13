/* eslint-disable global-require */

module.exports = (Characteristic) => {
  const DefaultCharacteristic = require('./default-characteristic')(
    Characteristic
  );
  return {
    Amperes: require('./amperes')(DefaultCharacteristic),
    KilowattHours: require('./kilowatt-hours')(DefaultCharacteristic),
    KilowattVoltAmpereHour: require('./kilowatt-volt-ampere-hour')(
      DefaultCharacteristic
    ),
    VoltAmperes: require('./volt-amperes')(DefaultCharacteristic),
    Volts: require('./volts')(DefaultCharacteristic),
    Watts: require('./watts')(DefaultCharacteristic),
  };
};
