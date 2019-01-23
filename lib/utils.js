'use strict';

function callbackify (func, errFunc) {
  return (...args) => {
    const onlyArgs = [];
    let callback = null;

    for (const arg of args) {
      if (typeof arg === 'function') {
        callback = arg;
        break;
      }

      onlyArgs.push(arg);
    }

    func(...onlyArgs)
      .then(data => callback(null, data))
      .catch(err => {
        if (typeof errFunc === 'function') errFunc(err);
        callback(err);
      });
  };
}

function callbackifyLogError (func) {
  return callbackify(func.bind(this), (reason) => {
    this.log.error('[%s] %s', this.displayName, func.name);
    this.log.error(reason);
  });
}

function getOrAddCharacteristic (service, characteristic) {
  return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
}

function kelvinToMired (kelvin) {
  return 1e6 / kelvin;
}

function lookup (value) {
  let keys = Object.keys(this);
  for (var i = 0; i < keys.length; i++) {
    if (this[keys[i]] === value) { return keys[i]; }
  }
}

function miredToKelvin (mired) {
  return 1e6 / mired;
}

function removeCharacteristicIfFound (service, characteristic) {
  if (service.testCharacteristic(characteristic)) {
    const c = service.getCharacteristic(characteristic);
    this.log.warn('Removing stale Characteristic: [%s] [%s]', c.displayName, c.UUID);
    service.removeCharacteristic(c);
  }
}

function updateCharacteristicIfFound (service, characteristic, value) {
  if (service.testCharacteristic(characteristic)) {
    service.updateCharacteristic(characteristic, value);
  }
}

module.exports = {
  callbackify,
  callbackifyLogError,
  getOrAddCharacteristic,
  kelvinToMired,
  lookup,
  miredToKelvin,
  removeCharacteristicIfFound,
  updateCharacteristicIfFound
};
