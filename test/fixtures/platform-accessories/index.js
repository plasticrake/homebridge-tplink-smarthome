const accessoryStorage = require('node-persist').create();
const { PlatformAccessory } = require('homebridge/lib/platformAccessory');

const deserialize = function deserialize(serializedAccessory) {
  const platformAccessory = new PlatformAccessory(
    serializedAccessory.displayName,
    serializedAccessory.UUID,
    serializedAccessory.category
  );
  // eslint-disable-next-line no-underscore-dangle
  platformAccessory._configFromData(serializedAccessory);

  if (serializedAccessory.fixtureName != null) {
    platformAccessory.fixtureName = serializedAccessory.fixtureName;
  }

  return platformAccessory;
};

accessoryStorage.initSync({ dir: __dirname });

const platformAccessories = accessoryStorage
  .getItem('cachedAccessories.json')
  .map((serializedAccessory) => deserialize(serializedAccessory));

const platformAccessoriesIssues = accessoryStorage
  .getItem('cachedAccessoriesIssues.json')
  .map((serializedAccessory) => deserialize(serializedAccessory))
  .reduce((map, platformAccessory) => {
    map.set(platformAccessory.fixtureName, platformAccessory);
    return map;
  }, new Map());

module.exports = { platformAccessories, platformAccessoriesIssues };
