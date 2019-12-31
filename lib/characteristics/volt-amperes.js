module.exports = DefaultCharacteristic => {
  class VoltAmperes extends DefaultCharacteristic {
    constructor() {
      super('Apparent Power', VoltAmperes.UUID, {
        format: DefaultCharacteristic.Formats.UINT16,
        unit: 'VA',
        minStep: 1,
      });
    }
  }
  VoltAmperes.UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';
  return VoltAmperes;
};
