module.exports = hap => {
  const { Service } = hap;
  const { Characteristic } = hap;

  return (homebridgeAccessory, hkDevice) => {
    const infoService = homebridgeAccessory.getService(
      Service.AccessoryInformation
    );
    if (!infoService.getCharacteristic(Characteristic.FirmwareRevision)) {
      infoService.addCharacteristic(Characteristic.FirmwareRevision);
    }
    if (!infoService.getCharacteristic(Characteristic.HardwareRevision)) {
      infoService.addCharacteristic(Characteristic.HardwareRevision);
    }
    infoService
      .setCharacteristic(Characteristic.Name, hkDevice.name)
      .setCharacteristic(Characteristic.Manufacturer, hkDevice.manufacturer)
      .setCharacteristic(Characteristic.Model, hkDevice.model)
      .setCharacteristic(Characteristic.SerialNumber, hkDevice.serialNumber)
      .setCharacteristic(
        Characteristic.FirmwareRevision,
        hkDevice.firmwareRevision
      )
      .setCharacteristic(
        Characteristic.HardwareRevision,
        hkDevice.hardwareRevision
      );

    return infoService;
  };
};
