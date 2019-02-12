'use strict';

module.exports = function (Characteristic) {
  class DefaultCharacteristic extends Characteristic {
    constructor (displayName, UUID, props) {
      super(displayName, UUID);
      this.setProps(Object.assign({
        format: Characteristic.Formats.FLOAT,
        minValue: 0,
        maxValue: 65535,
        perms: [ Characteristic.Perms.READ, Characteristic.Perms.NOTIFY ]
      }, props));
      this.value = this.getDefaultValue();
    }
  }
  class Amperes extends DefaultCharacteristic {
    constructor () {
      super('Amperes', Amperes.UUID, {
        unit: 'A',
        minStep: 0.01
      });
    }
  }
  Amperes.UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';

  class KilowattHours extends DefaultCharacteristic {
    constructor () {
      super('Total Consumption', KilowattHours.UUID, {
        unit: 'kWh',
        minStep: 0.001
      });
    }
  }
  KilowattHours.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

  class KilowattVoltAmpereHour extends DefaultCharacteristic {
    constructor () {
      super('Apparent Energy', KilowattVoltAmpereHour.UUID, {
        format: Characteristic.Formats.UINT32,
        unit: 'kVAh',
        minStep: 1
      });
    }
  }
  KilowattVoltAmpereHour.UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';

  class VoltAmperes extends DefaultCharacteristic {
    constructor () {
      super('Apparent Power', VoltAmperes.UUID, {
        format: Characteristic.Formats.UINT16,
        unit: 'VA',
        minStep: 1
      });
    }
  }
  VoltAmperes.UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';
  class Volts extends DefaultCharacteristic {
    constructor () {
      super('Volts', Volts.UUID, {
        unit: 'V',
        minStep: 0.1
      });
    }
  }
  Volts.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

  class Watts extends DefaultCharacteristic {
    constructor () {
      super('Consumption', Watts.UUID, {
        unit: 'W',
        minStep: 0.1
      });
    }
  }
  Watts.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

  return { Amperes, KilowattHours, KilowattVoltAmpereHour, VoltAmperes, Volts, Watts };
};
