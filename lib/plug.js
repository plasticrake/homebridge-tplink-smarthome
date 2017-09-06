'use strict';

let Service;
let Characteristic;

class PlugAccessory {
  constructor (platform, config, accessory, client, plug) {
    this.platform = platform;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;

    this.log = platform.log;

    this.accessory = accessory;
    this.client = client;
    this.config = config;

    this.debug = !!(this.config.debug);

    this.deviceId = accessory.context.deviceId;

    this.plug = plug;
    this._plug.on('power-on', (plug) => { this.setOn(true); });
    this._plug.on('power-off', (plug) => { this.setOn(false); });
    this._plug.on('in-use', (plug) => { this.setOutletInUse(true); });
    this._plug.on('not-in-use', (plug) => { this.setOutletInUse(false); });

    accessory.on('identify', (paired, callback) => {
      this.log.debug('[%s] identify', this.accessory.displayName);
      this.plug.blink(10, 500).then(() => {
        this.log.debug('[%s] done blinking', this.accessory.displayName);
        callback();
      });
    });
  }

  get plug () { return this._plug; }

  set plug (plug) {
    this._plug = plug;
  }

  setOn (value) {
    this.log.debug('[%s] setOn(%s)', this.accessory.displayName, value);
    this.accessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.On)
      .setValue(value);
  }

  setOutletInUse (value) {
    this.log.debug('[%s] setOutletInUse(%s)', this.accessory.displayName, value);
    this.accessory.getService(Service.Outlet)
      .getCharacteristic(Characteristic.OutletInUse)
      .setValue(value);
  }

  configure (plug) {
    this.log.info('[%s] Configuring', this.accessory.displayName);

    let plugInfo = plug ? Promise.resolve(plug.getInfo) : this.plug.getInfo();

    return plugInfo.then((info) => {
      const pa = this.accessory;

      this.refresh(info.sysInfo);

      const outletService = pa.getService(Service.Outlet);
      outletService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          this.plug.getSysInfo().then((si) => {
            this.refresh(si);
            callback(null, si.relay_state === 1);
          }).catch((reason) => {
            this.log.error('[%s]', this.accessory.displayName);
            this.log.error(reason);
          });
        })
        .on('set', (value, callback) => {
          this.plug.setPowerState(value).then(() => {
            callback();
          }, (reason) => {
            this.log.error('[%s]', this.accessory.displayName);
            this.log.error(reason);
          });
        });

      outletService.getCharacteristic(Characteristic.OutletInUse)
        .on('get', (callback) => {
          this.plug.getSysInfo().then((si) => {
            this.refresh(si);
            if (plug.supportsConsumption) {
              this.plug.getConsumption().then((consumption) => {
                callback(null, consumption.power > 0);
              });
            } else {
              // On plugs that don't support consumption we use relay state
              callback(null, si.relay_state === 1);
            }
          }).catch((reason) => {
            this.log.error('[%s]', this.accessory.displayName);
            this.log.error(reason);
          });
        });
    }).catch((reason) => {
      this.log.error('[%s]', this.accessory.displayName);
      this.log.error(reason);
    });
  }

  refresh (sysInfo) {
    sysInfo = sysInfo ? Promise.resolve(sysInfo) : this.plug.getSysInfo();

    return sysInfo.then((si) => {
      const name = si.alias;
      this.accessory.displayName = name;

      const outletService = this.accessory.getService(Service.Outlet);
      outletService.setCharacteristic(Characteristic.Name, name);

      const infoService = this.accessory.getService(Service.AccessoryInformation);
      infoService
        .setCharacteristic(Characteristic.Name, name)
        .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
        .setCharacteristic(Characteristic.Model, si.model)
        .setCharacteristic(Characteristic.SerialNumber, si.deviceId)
        .setCharacteristic(Characteristic.FirmwareRevision, si.sw_ver)
        .setCharacteristic(Characteristic.HardwareRevision, si.hw_ver);

      this.accessory.context.lastRefreshed = new Date();
      return this;
    }).catch((reason) => {
      this.log.error('[%s]', this.accessory.displayName);
      this.log.error(reason);
    });
  }
}

module.exports = PlugAccessory;
