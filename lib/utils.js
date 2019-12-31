function callbackify(func, errFunc) {
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

function callbackifyLogError(func) {
  return callbackify(func.bind(this), reason => {
    this.log.error('[%s] %s', this.name, func.name);
    this.log.error(reason);
  });
}

function getOrAddCharacteristic(service, characteristic) {
  return (
    service.getCharacteristic(characteristic) ||
    service.addCharacteristic(characteristic)
  );
}

function kelvinToMired(kelvin) {
  return 1e6 / kelvin;
}

function lookup(compareFn, value) {
  if (compareFn == null) {
    // eslint-disable-next-line no-param-reassign
    compareFn = (thisKeyValue, val) => {
      return thisKeyValue === val;
    };
  }
  const keys = Object.keys(this);
  for (let i = 0; i < keys.length; i += 1) {
    if (compareFn(this[keys[i]], value)) {
      return keys[i];
    }
  }
  return null;
}

function miredToKelvin(mired) {
  return 1e6 / mired;
}

module.exports = {
  callbackify,
  callbackifyLogError,
  getOrAddCharacteristic,
  kelvinToMired,
  lookup,
  miredToKelvin,
};
