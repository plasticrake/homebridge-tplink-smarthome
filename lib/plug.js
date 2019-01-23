'use strict';

const AccessoryInformation = require('./accessory-information');
const { callbackifyLogError, getOrAddCharacteristic, lookup, removeCharacteristicIfFound } = require('./utils');

let Characteristic;
let CustomCharacteristic;

class PlugAccessory {
  constructor (platform, config, homebridgeAccessory, plug) {
    this.platform = platform;
    const PlatformAccessory = platform.api.platformAccessory;
    const Accessory = platform.api.hap.Accessory;
    const Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    const UUIDGen = platform.api.hap.uuid;
    CustomCharacteristic = require('./homekit')(platform.api);

    Accessory.Categories.lookup = lookup.bind(Accessory.Categories);

    this.log = platform.log;
    this.config = config;
    this.homebridgeAccessory = homebridgeAccessory;
    this.plug = plug;

    if (config.switchModels && config.switchModels.findIndex((m) => { if (plug.model.includes(m)) return true; }) !== -1) {
      this.homekitCategory = 'SWITCH';
      this.homekitServiceType = Service.Switch;
    } else {
      this.homekitCategory = 'OUTLET';
      this.homekitServiceType = Service.Outlet;
    }

    if (!this.homebridgeAccessory) {
      const uuid = UUIDGen.generate(plug.id);
      this.log.debug('Creating new Accessory [%s] [%s] [%s] homekitCategory: %s', plug.alias, plug.id, uuid, this.homekitCategory);
      this.homebridgeAccessory = new PlatformAccessory(plug.alias, uuid, Accessory.Categories[this.homekitCategory]);
      platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.log.debug('Existing Accessory found [%s] [%s] [%s] homekitCategory: %s', homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID, Accessory.Categories.lookup(homebridgeAccessory.category));
      this.homebridgeAccessory.displayName = plug.alias;
      if (this.homebridgeAccessory.category !== Accessory.Categories[this.homekitCategory]) {
        this.log.warn('[%s] Correcting Accessory Category from: %s to: %s', this.displayName, Accessory.Categories.lookup(this.homebridgeAccessory.category), this.homekitCategory);
        this.homebridgeAccessory.category = Accessory.Categories[this.homekitCategory];
      }
    }

    this.outletService = this.homebridgeAccessory.getService(this.homekitServiceType);
    if (!this.outletService) {
      this.log.debug('Creating new Service [%s] type:%s', plug.alias, this.homekitCategory);
      this.outletService = this.homebridgeAccessory.addService(this.homekitServiceType, plug.alias);
    } else {
      this.outletService.setCharacteristic(Characteristic.Name, plug.alias);
    }

    const callbackify = callbackifyLogError.bind(this);

    this.outletService.getCharacteristic(Characteristic.On)
      .on('get', callbackify(this.getOn))
      .on('set', callbackify(this.setOn));

    this._plug.on('power-on', () => { this.updateOnValue(true); });
    this._plug.on('power-off', () => { this.updateOnValue(false); });

    if (plug.supportsEmeter || this.homekitCategory === 'OUTLET') {
      this.outletService.getCharacteristic(Characteristic.OutletInUse)
        .on('get', callbackify(this.getOutletInUse.bind(this), this.logErr('getOutletInUse')));

      this._plug.on('in-use', () => { this.updateOutletInUseValue(true); });
      this._plug.on('not-in-use', () => { this.updateOutletInUseValue(false); });
    } else {
      if (this.homekitCategory === 'SWITCH') {
        removeCharacteristicIfFound.call(this, this.outletService, Characteristic.OutletInUse);
      }
    }

    if (plug.supportsEmeter && this.config.addCustomCharacteristics) {
      this.log.debug('Adding CustomCharacteristics (if needed) [%s]', this.displayName);

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Volts)
        .on('get', callbackify(this.getVolts));

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Amperes)
        .on('get', callbackify(this.getAmperes));

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Watts)
        .on('get', callbackify(this.getWatts));

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.VoltAmperes)
        .on('get', callbackify(this.getVoltAmperes));

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.KilowattHours)
        .on('get', callbackify(this.getKilowattHours));

      this._plug.on('emeter-realtime-update', (emeterRealtime) => { this.updateEnergyValues(emeterRealtime); });
    } else {
      [CustomCharacteristic.Volts, CustomCharacteristic.Amperes, CustomCharacteristic.Watts,
        CustomCharacteristic.VoltAmperes, CustomCharacteristic.KilowattHours]
        .forEach((c) => { removeCharacteristicIfFound.call(this, this.outletService, c); });
    }

    this.infoService = AccessoryInformation(platform.api.hap)(this.homebridgeAccessory, plug);

    this.homebridgeAccessory.context.mac = plug.macNormalized;
    this.homebridgeAccessory.context.deviceId = plug.id;

    this.homebridgeAccessory.on('identify', this.identify);

    // Remove Old Services
    this.homebridgeAccessory.services.forEach((service) => {
      if (service === this.outletService) { return; }
      if (service === this.infoService) { return; }
      this.log.warn('Removing stale Service: [%s] [%s] [%s]', service.displayName, service.UUID, service.subtype);
      this.homebridgeAccessory.removeService(service);
    });
  }

  get displayName () {
    return this.homebridgeAccessory.displayName;
  }

  get plug () { return this._plug; }

  set plug (plug) {
    this._plug = plug;
  }

  getOn () {
    this.log.debug('[%s] getOn', this.displayName);
    return this.plug.getPowerState().then((value) => {
      return value;
    });
  }

  setOn (value) {
    this.log.debug('[%s] setOn', this.displayName);
    return this.plug.setPowerState(value);
  }

  getOutletInUse () {
    return this.plug.getInUse().then((value) => {
      return value;
    });
  }

  getAmperes () {
    return this.plug.emeter.getRealtime().then((emeterRealtime) => {
      return emeterRealtime.current;
    });
  }

  getKilowattHours () {
    return this.plug.emeter.getRealtime().then((emeterRealtime) => {
      return emeterRealtime.total;
    });
  }

  getVoltAmperes () {
    return this.plug.emeter.getRealtime().then((emeterRealtime) => {
      return emeterRealtime.voltage * emeterRealtime.current;
    });
  }

  getVolts () {
    return this.plug.emeter.getRealtime().then((emeterRealtime) => {
      return emeterRealtime.voltage;
    });
  }

  getWatts () {
    return this.plug.emeter.getRealtime().then((emeterRealtime) => {
      return emeterRealtime.power;
    });
  }

  updateOnValue (value) {
    this.log.debug('[%s] updateOnValue(%s)', this.displayName, value);
    this.outletService.updateCharacteristic(Characteristic.On, value);
  }

  updateOutletInUseValue (value) {
    this.log.debug('[%s] updateOutletInUseValue(%s)', this.displayName, value);
    this.outletService.updateCharacteristic(Characteristic.OutletInUse, value);
  }

  updateEnergyValues (emeterRealtime) {
    this.log.debug('[%s] updateEnergyValues(%j)', this.displayName, emeterRealtime);
    this.outletService.updateCharacteristic(CustomCharacteristic.Amperes, emeterRealtime.current);
    this.outletService.updateCharacteristic(CustomCharacteristic.KilowattHours, emeterRealtime.total);
    this.outletService.updateCharacteristic(CustomCharacteristic.VoltAmperes, emeterRealtime.voltage * emeterRealtime.current);
    this.outletService.updateCharacteristic(CustomCharacteristic.Volts, emeterRealtime.voltage);
    this.outletService.updateCharacteristic(CustomCharacteristic.Watts, emeterRealtime.power);
  }

  identify (paired, callback) {
    this.log.debug('[%s] identify', this.displayName);
    let cbCalled = false;
    this.plug.blink(1, 500)
      .then(() => {
        callback(); // Callback after first blink so don't block
        cbCalled = true;
        return this.plug.blink(2, 500);
      })
      .then(() => { this.log.debug('[%s] identify done', this.displayName); })
      .catch((reason) => {
        if (!cbCalled) {
          return callback(new Error(reason));
        } else {
          this.log.error('[%s] identify error', this.displayName);
        }
      });
  }

  logErr (description) {
    const fn = (reason) => {
      this.log.error('[%s] %s', this.displayName, description);
      this.log.error(reason);
    };
    return fn.bind(this);
  }
}

module.exports = PlugAccessory;
