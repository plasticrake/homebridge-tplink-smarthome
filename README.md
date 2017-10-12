# homebridge-hs100
[![NPM Version](https://img.shields.io/npm/v/homebridge-hs100.svg)](https://www.npmjs.com/package/homebridge-hs100)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

TPLink HS100 / HS105 / HS110 / HS200 WiFi Smart Plug plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation
1. **Node v6.5 or greater is required.** Check by running: `node --version`
2. Install Homebridge using: `npm install -g homebridge` or `sudo npm install -g --unsafe-perm homebridge` ([more details](https://github.com/nfarina/homebridge#installation))
3. Install this plugin using: `npm install -g homebridge-hs100`
4. Update your configuration file. See the sample below.

# Updating

- `npm update -g homebridge-hs100`

# Configuration

## Sample Configuration

##### Minimal:
```js
"platforms": [{
    "platform": "Hs100",
    "name": "TPLink"
}]
```

##### All options with defaults:
```js
"platforms": [{
    "platform": "Hs100",
    "name": "TPLink",
    "deviceTypes": [],         // set to [] or ["plug", "bulb"] to find all TPLink device types or ["plug"] / ["bulb"] for only plugs or bulbs
    "macAddresses": [],        // Whitelist of mac addresses to include. If specified will ignore other devices
    "pollingInterval": 10,     // (seconds) How often to check device status in the background
    "switchModels": ["HS200"], // Matching models are created in homekit as a switch instead of an outlet
    "addCustomCharacteristics": true, // Adds energy monitoring characteristics viewable in Eve app
    "inUseThreshold": 0,       // (Watts) For plugs that support energy monitoring (HS110), min power draw for OutletInUse
    "timeout": 5               // (seconds) communication timeout
}]
```

I only have HS100, HS105 and HS110 (plugs), so I am unable to test Bulb support directly. I'd gladly accept pull requests to add features or equipment donations ([amazon wishlist](http://a.co/bw0EfsB)) so I can do my own development!

I have written a [TP-Link device simulator](https://github.com/plasticrake/tplink-smarthome-simulator) for automated testing that includes Bulbs. So while I don't have a physical Bulb to test with, I do have virtual ones!

| Model               | deviceType | Characteristics   | Support                 |
|---------------------|------------|-------------------|-------------------------|
| HS100, HS105, HS110 | plug       | On<br/>OutletInUse (based on On state) | Good |
| HS110               | plug       | On<br/>OutletInUse (based on energy monitoring)<br/>Volts (Custom)<br/>Amperes (Custom)<br/>Watts (Custom)<br/>VoltAmperes (Custom)<br/>KilowattHours (Custom)<br/>KilowattVoltAmpereHour (Custom) | Good |
| HS200               | plug       | On                | Reported Good <br /> Same API as Plug |
| LB100, LB110        | bulb       | On<br/>Brightness | Not tested |
| LB120               | bulb       | On<br/>Brightness<br/>ColorTemperature | Not tested   |
| LB130               | bulb       | On<br/>Brightness<br/>ColorTemperature<br/>Hue<br/>Saturation | Not tested  |

### Custom Characteristics in Eve
Devices that support energy monitoring (HS110) will have extra characteristics that are viewable in the Eve app. Turn this off by setting `addCustomCharacteristics` false.

![eveplug](https://user-images.githubusercontent.com/1383980/30236344-5ca0e866-94cc-11e7-9cf7-bb5632291082.png)

### Accessory Names
Note the name in Homebridge/HomeKit may be out of sync from the Kasa app. This is a [Homebridge/HomeKit limitation](https://github.com/nfarina/homebridge#limitations). You can rename your accessory through the Home app.

## Troubleshooting
### UUID Errors
`Error: Cannot add a bridged Accessory with the same UUID as another bridged Accessory`
If you get an error about duplicate UUIDs you'll have to either remove your cached configuration files or manually edit them to remove the offending entry. By default they are stored in `~/.homebridge/persist` and `~/.homebridge/accessories`.

You can remove them by running:
`rm -rf ~/.homebridge/persist && rm -rf ~/.homebridge/accessories`

You may also need to un-pair and re-pair your bridge to Homekit.

## Credits
Thanks to George Georgovassilis and Thomas Baust for reverse engineering the HS1XX protocol.
https://blog.georgovassilis.com/2016/05/07/controlling-the-tp-link-hs100-wi-fi-smart-plug/
