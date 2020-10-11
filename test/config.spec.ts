import { expect } from 'chai';
import { parseConfig, defaultConfig } from '../src/config';

describe('config', function () {
  describe('parseConfig', function () {
    const minimalConfig = { platform: 'TplinkSmarthomeApi' };

    it('should provide defaults with no config options', function () {
      const parsedConfig = parseConfig(minimalConfig);
      expect(parsedConfig).to.not.be.null;

      const parsedDefaultConfig = parseConfig(defaultConfig);
      expect(parsedConfig).to.eql(parsedDefaultConfig);
    });
  });
});
