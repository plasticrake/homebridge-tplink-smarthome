const { HomeKitDevice } = require('.');

let Characteristic;
let CustomCharacteristic;

class HomeKitDevicePlug extends HomeKitDevice {
  constructor(platform, tplinkDevice) {
    super(platform, tplinkDevice);

    Characteristic = platform.homebridge.hap.Characteristic;
    CustomCharacteristic = platform.customCharacteristics;

    this.addBasicCharacteristics();

    if (tplinkDevice.supportsDimmer) {
      this.addBrightnessCharacteristics();
    }
    if (tplinkDevice.supportsEmeter) {
      this.addEnergyCharacteristics();
    }
  }

  identify(paired, callback) {
    this.log.info(`[${this.name}] identify`);
    let cbCalled = false;
    this.tplinkDevice
      .blink(1, 500)
      .then(() => {
        callback(); // Callback after first blink so don't block
        cbCalled = true;
        return this.tplinkDevice.blink(2, 500);
      })
      .then(() => {
        this.log.debug(`[${this.name}] identify done`);
      })
      .catch((reason) => {
        if (!cbCalled) {
          callback(new Error(reason));
        }
        this.log.error(`[${this.name}] identify error`);
        this.log.error(reason);
      });
  }

  /**
   * @private
   */
  addBasicCharacteristics() {
    this.addCharacteristic(Characteristic.On, {
      getValue: async () => {
        return this.tplinkDevice.getPowerState().then((value) => {
          return value;
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.setPowerState(value);
      },
    });
    this.tplinkDevice.on('power-on', () => {
      this.fireCharacteristicUpdateCallback(Characteristic.On, true);
    });
    this.tplinkDevice.on('power-off', () => {
      this.fireCharacteristicUpdateCallback(Characteristic.On, false);
    });

    this.addCharacteristic(Characteristic.OutletInUse, {
      getValue: async () => {
        return this.tplinkDevice.getInUse().then((value) => {
          return value;
        });
      },
    });
    this.tplinkDevice.on('in-use', () => {
      this.fireCharacteristicUpdateCallback(Characteristic.OutletInUse, true);
    });
    this.tplinkDevice.on('not-in-use', () => {
      this.fireCharacteristicUpdateCallback(Characteristic.OutletInUse, false);
    });
  }

  /**
   * @private
   */
  addBrightnessCharacteristics() {
    this.addCharacteristic(Characteristic.Brightness, {
      getValue: async () => {
        return this.tplinkDevice.getSysInfo().then((sysInfo) => {
          return sysInfo.brightness;
        });
      },
      setValue: async (value) => {
        return this.tplinkDevice.dimmer.setBrightness(value);
      },
    });
    // TODO: event for brightness change
    // this.tplinkDevice.on('power-on', () => { this.fireCharacteristicUpdateCallback(Characteristic.On, true); });
    // this.tplinkDevice.on('power-off', () => { this.fireCharacteristicUpdateCallback(Characteristic.On, false); });
  }

  /**
   * @private
   */
  addEnergyCharacteristics() {
    this.addCharacteristic(CustomCharacteristic.Amperes, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.current;
        });
      },
    });

    this.addCharacteristic(CustomCharacteristic.KilowattHours, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.total;
        });
      },
    });

    this.addCharacteristic(CustomCharacteristic.VoltAmperes, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.voltage * emeterRealtime.current;
        });
      },
    });

    this.addCharacteristic(CustomCharacteristic.Volts, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.voltage;
        });
      },
    });

    this.addCharacteristic(CustomCharacteristic.Watts, {
      getValue: async () => {
        return this.tplinkDevice.emeter.getRealtime().then((emeterRealtime) => {
          return emeterRealtime.power;
        });
      },
    });

    this.tplinkDevice.on('emeter-realtime-update', (emeterRealtime) => {
      this.fireCharacteristicUpdateCallback(
        CustomCharacteristic.Amperes,
        emeterRealtime.current
      );
      this.fireCharacteristicUpdateCallback(
        CustomCharacteristic.KilowattHours,
        emeterRealtime.total
      );
      this.fireCharacteristicUpdateCallback(
        CustomCharacteristic.VoltAmperes,
        emeterRealtime.voltage * emeterRealtime.current
      );
      this.fireCharacteristicUpdateCallback(
        CustomCharacteristic.Volts,
        emeterRealtime.voltage
      );
      this.fireCharacteristicUpdateCallback(
        CustomCharacteristic.Watts,
        emeterRealtime.power
      );
    });
  }
}

module.exports.HomeKitDevicePlug = HomeKitDevicePlug;
