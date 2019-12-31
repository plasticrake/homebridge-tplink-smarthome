module.exports = DefaultCharacteristic => {
  class Amperes extends DefaultCharacteristic {
    constructor() {
      super('Amperes', Amperes.UUID, {
        unit: 'A',
        minStep: 0.01,
      });
    }
  }
  Amperes.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';
  return Amperes;
};
