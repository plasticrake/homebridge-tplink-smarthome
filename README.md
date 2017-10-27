# homebridge-tplink-smarthome
[![NPM Version](https://img.shields.io/npm/v/homebridge-tplink-smarthome.svg)](https://www.npmjs.com/package/homebridge-tplink-smarthome)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

TPLink Smart Home Plugin for [Homebridge](https://github.com/nfarina/homebridge). (formerly `homebridge-hs100`)

**Models Supported**
- **Plugs:** HS100, HS105, HS110, HS200
- **Bulbs:** LB100, LB110, LB120, LB130

## Installation
1. **Node v6.5 or greater is required.** Check by running: `node --version`
2. Install Homebridge using: `npm install -g homebridge` or `sudo npm install -g --unsafe-perm homebridge` ([more details](https://github.com/nfarina/homebridge#installation))
3. Install this plugin using: `npm install -g homebridge-tplink-smarthome`
4. Update your configuration file. See the sample below.

## Updating

- `npm update -g homebridge-tplink-smarthome`

## Note for Previous Users of  homebridge-hs100

If you had `homebridge-hs100` installed previously, due to how homebridge works, you may get this error on startup: `Error: Cannot add a bridged Accessory with the same UUID as another bridged Accessory:`. You'll need to remedy this by deleting the `cachedAccessories` file, or by manually editing the file to remove the old accessories under `homebridge-hs100`. On most systems that file will be here: `~/.homebridge/accessories/cachedAccessories`.

## Configuration

### Sample Configuration

##### Minimal:
```js
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome"
}]
```

##### All options with defaults:
```js
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome",

  ////////////////////////////////
  // Device Discovery Options
  ////////////////////////////////
  "broadcast": "255.255.255.255", // Broadcast Address
  "devices": [],         // Manual list of devices (see section below)
  "deviceTypes": [],     // set to [] or ["plug", "bulb"] to find all TPLink device types or ["plug"] / ["bulb"] for only plugs or bulbs
  "macAddresses": [],    // Whitelist of mac addresses to include. If specified will ignore other devices
  "pollingInterval": 10, // (seconds) How often to check device status in the background

  ////////////////////////////////
  // Device Options
  ////////////////////////////////
  "addCustomCharacteristics": true, // Adds energy monitoring characteristics viewable in Eve app
  "inUseThreshold": 0,       // (Watts) For plugs that support energy monitoring (HS110), min power draw for OutletInUse
  "switchModels": ["HS200"], // Matching models are created in homekit as a switch instead of an outlet
  "timeout": 5               // (seconds) communication timeout
}]
```



| Model               | deviceType | Characteristics   |
|---------------------|------------|-------------------|
| HS100, HS105        | plug       | On<br/>OutletInUse (based on On state) |
| HS110               | plug       | On<br/>OutletInUse (based on energy monitoring)<br/>Volts (Custom)<br/>Amperes (Custom)<br/>Watts (Custom)<br/>VoltAmperes (Custom)<br/>KilowattHours (Custom)<br/>KilowattVoltAmpereHour (Custom) |
| HS200               | plug       | On                | Reported Good <br /> Same API as Plug |
| LB100, LB110        | bulb       | On<br/>Brightness |
| LB120               | bulb       | On<br/>Brightness<br/>ColorTemperature |
| LB130               | bulb       | On<br/>Brightness<br/>ColorTemperature<br/>Hue<br/>Saturation |

<img src="https://user-images.githubusercontent.com/1383980/30236344-5ca0e866-94cc-11e7-9cf7-bb5632291082.png" align="right" alt="Eve Screenshot - Custom Characteristics" width=250>

### Custom Characteristics in Eve
Devices that support energy monitoring (HS110) will have extra characteristics that are viewable in the Eve app. Turn this off by setting `addCustomCharacteristics` false.

### Manually Specifying Devices
If you have a network setup where UDP broadcast is not working, you can manually specify the devices you'd like this plugin to use. This will send the discovery message directly to these devices in addition to the UDP broadcast. **Note that your device must have a static IP to work.**
```js
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome",

  "devices": [
    { host: "192.168.0.100" },
    { host: "192.168.0.101" },
    { host: "192.168.0.102", port: "9999" } // port defaults to "9999" but can be overriden
  ]
}]
```

### Accessory Names
Note the name in Homebridge/HomeKit may be out of sync from the Kasa app. This is a [Homebridge/HomeKit limitation](https://github.com/nfarina/homebridge#limitations). You can rename your accessory through the Home app.

## Troubleshooting
### UUID Errors
`Error: Cannot add a bridged Accessory with the same UUID as another bridged Accessory`
If you get an error about duplicate UUIDs you'll have to either remove your cached configuration files or manually edit them to remove the offending entry. By default they are stored in `~/.homebridge/accessories`. In some cases you may also need to remove `~/.homebridge/persist` and re-pair homebridge to your home.

You can remove them by running:
- `rm -rf ~/.homebridge/accessories`
- `rm -rf ~/.homebridge/persist`

## Credits
Thanks to George Georgovassilis and Thomas Baust for reverse engineering the HS1XX protocol.
https://blog.georgovassilis.com/2016/05/07/controlling-the-tp-link-hs100-wi-fi-smart-plug/
