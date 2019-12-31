module.exports = DefaultCharacteristic => {
  class Volts extends DefaultCharacteristic {
    constructor() {
      super('Volts', Volts.UUID, {
        unit: 'V',
        minStep: 0.1,
      });
    }
  }
  Volts.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';
  return Volts;
};
