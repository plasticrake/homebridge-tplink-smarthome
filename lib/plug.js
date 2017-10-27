'use strict';

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;
let CustomCharacteristic;

const lookup = function (value) {
  let keys = Object.keys(this);
  for (var i = 0; i < keys.length; i++) {
    if (this[keys[i]] === value) { return keys[i]; }
  }
};

const getOrAddCharacteristic = (service, characteristic) => {
  return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};

const removeCharacteristicIfFound = function (service, characteristic) {
  if (service.testCharacteristic(characteristic)) {
    const c = service.getCharacteristic(characteristic);
    this.log.warn('Removing stale Characteristic: [%s] [%s]', c.displayName, c.UUID);
    service.removeCharacteristic(c);
  }
};

class PlugAccessory {
  constructor (platform, config, homebridgeAccessory, plug) {
    this.platform = platform;
    PlatformAccessory = platform.api.platformAccessory;
    Accessory = platform.api.hap.Accessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;
    CustomCharacteristic = require('./homekit.js')(platform.api).CustomCharacteristic;

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
      this.log.debug('Creating new Accessory [%s] [%s] [%s] homekitCategory: %s', plug.alias, plug.deviceId, UUIDGen.generate(plug.deviceId), this.homekitCategory);
      this.homebridgeAccessory = new PlatformAccessory(plug.alias, UUIDGen.generate(plug.deviceId), Accessory.Categories[this.homekitCategory]);
      platform.registerPlatformAccessory(this.homebridgeAccessory);
    } else {
      this.log.debug('Existing Accessory found [%s] [%s] [%s] homekitCategory: %s', homebridgeAccessory.displayName, homebridgeAccessory.context.deviceId, homebridgeAccessory.UUID, Accessory.Categories.lookup(homebridgeAccessory.category));
      this.homebridgeAccessory.displayName = plug.alias;
      if (this.homebridgeAccessory.category !== Accessory.Categories[this.homekitCategory]) {
        this.log.warn('[%s] Correcting Accessory Category from: %s to: %s', this.homebridgeAccessory.displayName, Accessory.Categories.lookup(this.homebridgeAccessory.category), this.homekitCategory);
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

    this.outletService.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        this.log.debug('[%s] On get', this.homebridgeAccessory.displayName);
        this.plug.getPowerState().then((value) => {
          callback(null, value);
        }).catch((reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getPowerState');
          this.log.error(reason);
          callback(new Error(reason));
        });
      })
      .on('set', (value, callback) => {
        this.log.debug('[%s] On set', this.homebridgeAccessory.displayName);
        this.plug.setPowerState(value).then(() => {
          callback();
        }, (reason) => {
          this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'setPowerState');
          this.log.error(reason);
          callback(new Error(reason));
        });
      });

    this._plug.on('power-on', () => { this.setOn(true); });
    this._plug.on('power-off', () => { this.setOn(false); });

    if (plug.supportsEmeter || this.homekitCategory === 'OUTLET') {
      this.outletService.getCharacteristic(Characteristic.OutletInUse)
        .on('get', (callback) => {
          this.log.debug('[%s] OutletInUse get', this.homebridgeAccessory.displayName);
          this.plug.getInUse().then((value) => {
            callback(null, value);
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'getInUse');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      this._plug.on('in-use', () => { this.setOutletInUse(true); });
      this._plug.on('not-in-use', () => { this.setOutletInUse(false); });
    } else {
      if (this.homekitCategory === 'SWITCH') {
        removeCharacteristicIfFound.call(this, this.outletService, Characteristic.OutletInUse);
      }
    }

    if (plug.supportsEmeter && this.config.addCustomCharacteristics) {
      this.log.debug('Adding CustomCharacteristics [%s]', this.homebridgeAccessory.displayName);

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Volts)
        .on('get', (callback) => {
          this.plug.emeter.getRealtime().then((emeterRealtime) => {
            callback(null, Math.round(emeterRealtime.voltage));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Volts emeter.getRealtime');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Amperes)
        .on('get', (callback) => {
          this.plug.emeter.getRealtime().then((emeterRealtime) => {
            callback(null, Math.round(emeterRealtime.current));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Amperes emeter.getRealtime');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.Watts)
        .on('get', (callback) => {
          this.plug.emeter.getRealtime().then((emeterRealtime) => {
            callback(null, Math.round(emeterRealtime.power));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'Watts emeter.getRealtime');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.VoltAmperes)
        .on('get', (callback) => {
          this.plug.emeter.getRealtime().then((emeterRealtime) => {
            callback(null, Math.round(emeterRealtime.voltage * emeterRealtime.current));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'VoltAmperes emeter.getRealtime');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });

      getOrAddCharacteristic(this.outletService, CustomCharacteristic.KilowattHours)
        .on('get', (callback) => {
          this.plug.emeter.getRealtime().then((emeterRealtime) => {
            callback(null, Math.round(emeterRealtime.total));
          }).catch((reason) => {
            this.log.error('[%s] %s', this.homebridgeAccessory.displayName, 'KilowattHours emeter.getRealtime');
            this.log.error(reason);
            callback(new Error(reason));
          });
        });
    } else {
      [CustomCharacteristic.Volts, CustomCharacteristic.Amperes, CustomCharacteristic.Watts,
        CustomCharacteristic.VoltAmperes, CustomCharacteristic.KilowattHours]
      .forEach((c) => { removeCharacteristicIfFound.call(this, this.outletService, c); });
    }

    this.infoService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
    if (!this.infoService.getCharacteristic(Characteristic.FirmwareRevision)) {
      this.infoService.addCharacteristic(Characteristic.FirmwareRevision);
    }
    if (!this.infoService.getCharacteristic(Characteristic.HardwareRevision)) {
      this.infoService.addCharacteristic(Characteristic.HardwareRevision);
    }
    this.infoService
      .setCharacteristic(Characteristic.Name, plug.alias)
      .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(Characteristic.Model, plug.model)
      .setCharacteristic(Characteristic.SerialNumber, plug.mac)
      .setCharacteristic(Characteristic.FirmwareRevision, plug.softwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, plug.hardwareVersion);

    this.homebridgeAccessory.context.deviceId = plug.deviceId;
    this.homebridgeAccessory.on('identify', (paired, callback) => {
      this.log.debug('[%s] identify', this.homebridgeAccessory.displayName);
      let cbCalled = false;
      this.plug.blink(1, 500)
        .then(() => {
          callback();  // Callback after first blink so don't block
          cbCalled = true;
          return this.plug.blink(2, 500);
        })
        .then(() => { this.log.debug('[%s] identify done', this.homebridgeAccessory.displayName); })
        .catch((reason) => {
          if (!cbCalled) {
            return callback(new Error(reason));
          } else {
            this.log.error('[%s] identify error', this.homebridgeAccessory.displayName);
          }
        });
    });

    // Remove Old Services
    this.homebridgeAccessory.services.forEach((service) => {
      if (service === this.outletService) { return; }
      if (service === this.infoService) { return; }
      this.log.warn('Removing stale Service: [%s] [%s] [%s]', service.displayName, service.UUID, service.subtype);
      this.homebridgeAccessory.removeService(service);
    });
  }

  get plug () { return this._plug; }

  set plug (plug) {
    this._plug = plug;
  }

  setOn (value) {
    this.log.debug('[%s] setOn(%s)', this.homebridgeAccessory.displayName, value);
    this.outletService
      .getCharacteristic(Characteristic.On)
      .updateValue(value);
  }

  setOutletInUse (value) {
    this.log.debug('[%s] setOutletInUse(%s)', this.homebridgeAccessory.displayName, value);
    this.outletService
      .getCharacteristic(Characteristic.OutletInUse)
      .updateValue(value);
  }
}

module.exports = PlugAccessory;
