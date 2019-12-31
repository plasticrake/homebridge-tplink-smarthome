module.exports = Characteristic => {
  return class DefaultCharacteristic extends Characteristic {
    constructor(displayName, UUID, props) {
      super(displayName, UUID);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        minValue: 0,
        maxValue: 65535,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        ...props,
      });
      this.value = this.getDefaultValue();
    }
  };
};
