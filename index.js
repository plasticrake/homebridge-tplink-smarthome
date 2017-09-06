'use strict';

const Hs100Platform = require('./lib/platform');

module.exports = function (homebridge) {
  const dynamic = true;
  Hs100Platform.setHomebridge(homebridge);
  homebridge.registerPlatform('homebridge-hs100', 'Hs100', Hs100Platform, dynamic);
};
