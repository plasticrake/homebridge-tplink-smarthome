module.exports = DefaultCharacteristic => {
  class Watts extends DefaultCharacteristic {
    constructor() {
      super('Consumption', Watts.UUID, {
        unit: 'W',
        minStep: 0.1,
      });
    }
  }
  Watts.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
  return Watts;
};
