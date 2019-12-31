module.exports = DefaultCharacteristic => {
  class KilowattHours extends DefaultCharacteristic {
    constructor() {
      super('Total Consumption', KilowattHours.UUID, {
        unit: 'kWh',
        minStep: 0.001,
      });
    }
  }
  KilowattHours.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
  return KilowattHours;
};
