/**
 * @typedef {import('tplink-smarthome-api').Device} Device
 */

class HomeKitDevice {
  /**
   * Factory method to create a HomeKitDeviceBulb or HomeKitDevicePlug.
   *
   * @static
   * @param {import('tplink-smarthome-api')} platform
   * @param {Device} tplinkDevice
   * @returns {HomeKitDeviceBulb|HomeKitDevicePlug}
   * @memberof HomeKitDevice
   */
  static create(platform, tplinkDevice) {
    // require needed here to avoid circular dependency
    // eslint-disable-next-line global-require
    const { HomeKitDeviceBulb } = require('./bulb');
    // eslint-disable-next-line global-require
    const { HomeKitDevicePlug } = require('./plug');
    if (tplinkDevice.deviceType === 'bulb') {
      return new HomeKitDeviceBulb(platform, tplinkDevice);
    }
    return new HomeKitDevicePlug(platform, tplinkDevice);
  }

  /**
   * Creates an instance of HomeKitDevice.
   *
   * @abstract
   * @param {import('tplink-smarthome-api')} platform
   * @param {Device} tplinkDevice
   * @memberof HomeKitDevice
   */
  constructor(platform, tplinkDevice) {
    this.platform = platform;
    this.log = platform.log;
    this.tplinkDevice = tplinkDevice;

    this.characteristics = {};

    this.addCharacteristic(platform.homebridge.hap.Characteristic.Name, {
      getValue: async () => {
        return this.name;
      },
    });
  }

  get id() {
    return this.tplinkDevice.id;
  }

  get name() {
    return this.tplinkDevice.alias;
  }

  // eslint-disable-next-line class-methods-use-this
  get manufacturer() {
    return 'TP-Link';
  }

  get model() {
    return this.tplinkDevice.model;
  }

  get serialNumber() {
    return `${this.tplinkDevice.mac} ${this.tplinkDevice.id}`;
  }

  get firmwareRevision() {
    return this.tplinkDevice.softwareVersion;
  }

  get hardwareRevision() {
    return this.tplinkDevice.hardwareVersion;
  }

  supportsCharacteristic(characteristic) {
    return this.getCharacteristic(characteristic) != null;
  }

  supportsCharacteristicSet(characteristic) {
    const c = this.getCharacteristic(characteristic);
    if (c == null) return false;
    return typeof c.setValue === 'function';
  }

  /**
   *
   * @param {import('hap-nodejs').WithUUID<import('hap-nodejs').Characteristic>} characteristic
   * @param {Object} param1
   * @param {Function} param1.getValue
   * @param {Function} [param1.setValue]
   * @param {Partial<import('hap-nodejs').CharacteristicProps>} [param1.props]
   */
  addCharacteristic(characteristic, { getValue, setValue, props }) {
    this.characteristics[characteristic.UUID] = { getValue, setValue, props };
  }

  /**
   * @private
   */
  getCharacteristic(characteristic) {
    return this.characteristics[characteristic.UUID];
  }

  getCharacteristicProps(characteristic) {
    this.log.debug(
      '[%s] getCharacteristicProps',
      this.name,
      this.platform.getCharacteristicName(characteristic)
    );
    return this.getCharacteristic(characteristic).props;
  }

  async getCharacteristicValue(characteristic) {
    this.log.debug(
      '[%s] getCharacteristicValue',
      this.name,
      this.platform.getCharacteristicName(characteristic)
    );
    return this.getCharacteristic(characteristic).getValue();
  }

  async setCharacteristicValue(characteristic, value) {
    this.log.debug(
      '[%s] setCharacteristicValue [%s]',
      this.name,
      value,
      this.platform.getCharacteristicName(characteristic)
    );
    return this.getCharacteristic(characteristic).setValue(value);
  }

  fireCharacteristicUpdateCallback(characteristic, value) {
    this.log.debug(
      '[%s] fireCharacteristicUpdateCallback [%s]',
      this.name,
      value,
      this.platform.getCharacteristicName(characteristic)
    );
    const c = this.getCharacteristic(characteristic);
    if (c && typeof c.updateCallback === 'function') {
      this.getCharacteristic(characteristic).updateCallback(value);
    }
  }

  setCharacteristicUpdateCallback(characteristic, callbackFn) {
    this.log.debug(
      '[%s] setCharacteristicUpdateCallback [%s]',
      this.name,
      this.platform.getCharacteristicName(characteristic),
      callbackFn.name
    );
    this.getCharacteristic(characteristic).updateCallback = callbackFn;
  }
}

module.exports.HomeKitDevice = HomeKitDevice;
