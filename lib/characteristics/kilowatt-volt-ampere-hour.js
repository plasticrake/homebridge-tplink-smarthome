module.exports = DefaultCharacteristic => {
  class KilowattVoltAmpereHour extends DefaultCharacteristic {
    constructor() {
      super('Apparent Energy', KilowattVoltAmpereHour.UUID, {
        format: DefaultCharacteristic.Formats.UINT32,
        unit: 'kVAh',
        minStep: 1,
      });
    }
  }
  KilowattVoltAmpereHour.UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';
  return KilowattVoltAmpereHour;
};
