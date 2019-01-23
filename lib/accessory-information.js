'use strict';

module.exports = function (hap) {
  const Service = hap.Service;
  const Characteristic = hap.Characteristic;

  return function (homebridgeAccessory, device) {
    const infoService = homebridgeAccessory.getService(Service.AccessoryInformation);
    if (!infoService.getCharacteristic(Characteristic.FirmwareRevision)) {
      infoService.addCharacteristic(Characteristic.FirmwareRevision);
    }
    if (!infoService.getCharacteristic(Characteristic.HardwareRevision)) {
      infoService.addCharacteristic(Characteristic.HardwareRevision);
    }
    infoService
      .setCharacteristic(Characteristic.Name, device.alias)
      .setCharacteristic(Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(Characteristic.Model, device.model)
      .setCharacteristic(Characteristic.SerialNumber, device.mac)
      .setCharacteristic(Characteristic.FirmwareRevision, device.softwareVersion)
      .setCharacteristic(Characteristic.HardwareRevision, device.hardwareVersion);

    return infoService;
  };
};
