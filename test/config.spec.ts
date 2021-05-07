import { expect } from 'chai';
import { parseConfig, defaultConfig, ConfigParseError } from '../src/config';

describe('config', function () {
  describe('parseConfig', function () {
    const minimalConfig = {
      platform: 'TplinkSmarthomeApi',
      name: 'tplinkSmarthomeApi',
    };

    const configInvalid = {
      platform: 'TplinkSmarthomeApi',
      name: 'tplinkSmarthomeApi',
      addCaddCustomCharacteristics: 'true',
      inUseThreshold: 'foo',
      switchModels: 'foo',
      discoveryPort: 'foo',
      broadcast: 255,
      pollingInterval: 'foo',
      deviceTypes: [],
      macAddresses: [],
      excludeMacAddresses: [],
      devices: [],
      timeout: 'foo',
      transport: 'foo',
      waitTimeUpdate: 'foo',
    };

    it('should provide defaults with no config options', function () {
      const parsedConfig = parseConfig(minimalConfig);
      expect(parsedConfig).to.not.be.null;

      const parsedDefaultConfig = parseConfig({
        ...defaultConfig,
        name: 'defaultName',
      });
      expect(parsedConfig).to.eql(parsedDefaultConfig);
    });

    it('should throw ConfigParseError with incorrect types', function () {
      expect(() => {
        parseConfig(configInvalid);
      }).to.throw(ConfigParseError, 'must be');
    });

    it('should throw ConfigParseError with incorrect devices', function () {
      expect(() => {
        parseConfig({
          devices: [{ host: 123 }],
        });
      }).to.throw(ConfigParseError, '`devices/0/host` must be string');

      expect(() => {
        parseConfig({
          devices: [{ port: 123 }],
        });
      }).to.throw(
        ConfigParseError,
        "`devices/0` must have required property 'host'\n`devices/0/port` must be string"
      );

      expect(() => {
        parseConfig({
          devices: [{ badHost: 'host' }],
        });
      }).to.throw(
        ConfigParseError,
        "`devices/0` must have required property 'host'"
      );

      expect(() => {
        parseConfig({
          devices: [{ badHost: 'host' }],
        });
      }).to.throw(
        ConfigParseError,
        "`devices/0` must have required property 'host'"
      );
    });
  });
});
