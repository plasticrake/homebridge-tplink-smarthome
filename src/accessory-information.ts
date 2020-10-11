import type { HAP, PlatformAccessory, Service } from 'homebridge';
import type HomekitDevice from './homekit-device';

export default function accessoryInformation(
  hap: HAP
): (
  accessory: PlatformAccessory,
  hkDevice: HomekitDevice
) => Service | undefined {
  const { Characteristic } = hap;

  return (accessory: PlatformAccessory, hkDevice: HomekitDevice) => {
    const infoService = accessory.getService(hap.Service.AccessoryInformation);
    if (infoService === undefined) return undefined;

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
}
