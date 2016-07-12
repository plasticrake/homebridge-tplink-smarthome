'use strict';

var Hs100 = require('Hs100-api');
var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform('homebridge-hs100', 'Hs100', Hs100Platform, false);
};

function Hs100Platform (log, config, api) {
  this.log = log;
  this.config = config || {};
  this.api = api;

  this.accessoriesConfig = config['accessories'];
}

Hs100Platform.prototype = {
  accessories: function (callback) {
    var foundAccessories = [];

    this.accessoriesConfig.forEach((config) => {
      var accessory = new Hs100Accessory(this.log, config);
      var p = accessory.refresh().catch((reason) => {
        this.log("Error initializing platform accessory '%s': %j", accessory.name, reason);
        return Promise.resolve(null);
      });
      foundAccessories.push(p);
    });

    Promise.all(foundAccessories).then((values) => {
      var validAccessories = values.filter(Boolean);
      callback(validAccessories);
    }, (reason) => {
      this.log(reason);
      callback();
    });
  }
};

function Hs100Accessory (log, config) {
  this.log = log;

  this.host = config['host'];
  this.port = config['port'] || 9999;
  this.configuredName = config['name'];
  this.name = this.configuredName || this.host;

  this.lastRefreshed = 0;

  this.hs100 = new Hs100({host: this.host, port: this.port});
}

Hs100Accessory.prototype = {
  getServices: function () {
    this.service.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        this.hs100.getPowerState().then((value) => {
          callback(null, value);
        }, (reason) => {
          this.log(reason);
        });
        this.refreshIfStale();
      })
      .on('set', (value, callback) => {
        this.hs100.setPowerState(value).then(() => {
          callback();
        }, (reason) => {
          this.log(reason);
        });
      });

    this.service.getCharacteristic(Characteristic.OutletInUse)
      .on('get', (callback) => {
        this.hs100.getPowerState().then((value) => {
          callback(null, value);
        }, (reason) => {
          this.log(reason);
        });
        this.refreshIfStale();
      });

    return [this.informationService, this.service];
  },

  identify: function (callback) {
    // TODO
    callback();
  },

  refreshIfStale: function () {
    if (((new Date()) - this.lastRefreshed) > 10000) {
      this.refresh().catch(reason => {
        this.log(reason);
      });
    }
  },

  refresh: function () {
    return this.hs100.getSysInfo().then((si) => {
      this.name = this.configuredName || si.alias || si.dev_name || this.host;
      if (!this.service) {
        this.service = new Service.Outlet(this.name, si.deviceId);
      } else {
        this.service.setCharacteristic(Characteristic.Name, this.name);
        this.service.displayName = this.name;
      }

      if (!this.informationService) {
        this.informationService = new Service.AccessoryInformation();
      }
      this.informationService
        .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
        .setCharacteristic(Characteristic.Model, si.model)
        .setCharacteristic(Characteristic.Name, si.dev_name)
        .setCharacteristic(Characteristic.SerialNumber, si.deviceId)
        .setCharacteristic(Characteristic.FirmwareRevision, si.sw_ver)
        .setCharacteristic(Characteristic.HardwareRevision, si.hw_ver);

      this.lastRefreshed = new Date();
      return this;
    });
  }
};
