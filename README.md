# homebridge-hs100
[![NPM Version](https://img.shields.io/npm/v/homebridge-hs100.svg)](https://www.npmjs.com/package/homebridge-hs100)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

TPLink HS100/HS110 WiFi Smart Plug plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install Homebridge using: `npm install -g homebridge` or `sudo npm install -g --unsafe-perm homebridge` ([more details](https://github.com/nfarina/homebridge#installation))
2. Install this plugin using: `npm install -g homebridge-hs100`
3. Update your configuration file. See the sample below.

# Updating

- `npm update -g homebridge-hs100`

# Configuration

## Sample Configuration

Minimal:
```json
"platforms": [{
    "platform": "Hs100",
    "name": "TPLink"
}]
```

All options with defaults:
```json
"platforms": [{
    "platform": "Hs100",
    "name": "TPLink",
    "deviceTypes": ["plug"]
}]
```

By default only smart plugs are configured (and switches, since they look identical to plugs in the API). I've heard reports that this can work with switches and lightbulbs, but I don't have any to test myself. Add the other deviceTypes to configure those as well or set deviceTypes to null to try to configure all devices.

I only have HS100, HS105 and HS110 (plugs), so I am unable to test Switch and Bulb support. I'd gladly accept pull requests to add features or equipment donations ([amazon wishlist](http://a.co/bw0EfsB)) so I can do my own development!

## Credits
Thanks to George Georgovassilis and Thomas Baust for reverse engineering the HS1XX protocol.
https://blog.georgovassilis.com/2016/05/07/controlling-the-tp-link-hs100-wi-fi-smart-plug/
