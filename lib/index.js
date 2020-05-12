const TplinkSmarthomePlatform = require('./platform');

module.exports = (homebridge) => {
  const dynamic = true;
  homebridge.registerPlatform(
    'homebridge-tplink-smarthome',
    'TplinkSmarthome',
    TplinkSmarthomePlatform,
    dynamic
  );
};
