'use strict';

class HomeKitDevice {
  static create (platform, tplinkDevice) {
    const { HomeKitDeviceBulb } = require('./bulb');
    const { HomeKitDevicePlug } = require('./plug');
    if (tplinkDevice.deviceType === 'bulb') {
      return new HomeKitDeviceBulb(...arguments);
    }
    return new HomeKitDevicePlug(...arguments);
  }

  constructor (platform, tplinkDevice) {
    this.platform = platform;
    this.log = platform.log;
    this.tplinkDevice = tplinkDevice;

    this.characteristics = {};

    this.addCharacteristic(platform.homebridge.hap.Characteristic.Name, {
      getValue: async () => {
        return this.name;
      }
    });
  }

  get id () {
    return this.tplinkDevice.id;
  }

  get name () {
    return this.tplinkDevice.alias;
  }

  get manufacturer () {
    return 'TP-Link';
  }
  get model () {
    return this.tplinkDevice.model;
  }

  get serialNumber () {
    return this.tplinkDevice.mac + ' ' + this.tplinkDevice.id;
  }

  get firmwareRevision () {
    return this.tplinkDevice.softwareVersion;
  }

  get hardwareRevision () {
    return this.tplinkDevice.hardwareVersion;
  }

  supportsCharacteristic (characteristic) {
    return this.getCharacteristic(characteristic) != null;
  }

  supportsCharacteristicSet (characteristic) {
    const c = this.getCharacteristic(characteristic);
    if (c == null) return false;
    return typeof c.setValue === 'function';
  }

  addCharacteristic (characteristic, { getValue, setValue }) {
    this.characteristics[characteristic.UUID] = { getValue, setValue };
  }

  /**
   * @private
   */
  getCharacteristic (characteristic) {
    return this.characteristics[characteristic.UUID];
  }

  async getCharacteristicValue (characteristic) {
    this.log.debug('[%s] getCharacteristicValue', this.name, this.platform.getCharacteristicName(characteristic));
    return this.getCharacteristic(characteristic).getValue();
  }

  async setCharacteristicValue (characteristic, value) {
    this.log.debug('[%s] setCharacteristicValue [%s]', this.name, value, this.platform.getCharacteristicName(characteristic));
    return this.getCharacteristic(characteristic).setValue(value);
  }

  fireCharacteristicUpdateCallback (characteristic, value) {
    this.log.debug('[%s] fireCharacteristicUpdateCallback [%s]', this.name, value, this.platform.getCharacteristicName(characteristic));
    const c = this.getCharacteristic(characteristic);
    if (typeof c.updateCallback === 'function') {
      this.getCharacteristic(characteristic).updateCallback(value);
    }
  }

  setCharacteristicUpdateCallback (characteristic, callbackFn) {
    this.log.debug('[%s] setCharacteristicUpdateCallback [%s]', this.name, this.platform.getCharacteristicName(characteristic), callbackFn.name);
    this.getCharacteristic(characteristic).updateCallback = callbackFn;
  }
}

module.exports.HomeKitDevice = HomeKitDevice;
