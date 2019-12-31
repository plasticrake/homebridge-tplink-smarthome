/* eslint-disable global-require */

module.exports = Characteristic => {
  const DefaultCharacteristic = require('./default-characteristic')(
    Characteristic
  );
  return {
    Amperes: require('./amperes')(DefaultCharacteristic),
  };
};
