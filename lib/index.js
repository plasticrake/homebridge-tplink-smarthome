const TplinkSmarthomePlatform = require('./platform');

module.exports = function(homebridge) {
  const dynamic = true;
  homebridge.registerPlatform(
    'homebridge-tplink-smarthome',
    'TplinkSmarthome',
    TplinkSmarthomePlatform,
    dynamic
  );
};
