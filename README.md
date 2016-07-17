# homebridge-hs100
[![NPM Version](https://img.shields.io/npm/v/homebridge-hs100.svg)](https://www.npmjs.com/package/homebridge-hs100)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

TPLink HS100/HS110 WiFi Smart Plug plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-hs100`
3. Update your configuration file. See the sample below.

# Updating

- `npm update -g homebridge-hs100`

# Configuration

## Sample Configuration

Configuration for 3 plugs. The name set in the Kasa App will be used as the name in Homebridge.
```json
"platforms": [{
    "platform": "Hs100",
    "accessories": [{
        "host": "10.0.1.2",
        "port": 9999
    }, {
        "host": "10.0.1.3",
        "port": 9999
    }, {
        "host": "10.0.1.4",
        "port": 9999
    }]
}],
```

## Credits
Thanks to George Georgovassilis and Thomas Baust for reverse engineering the HS1XX protocol.
https://georgovassilis.blogspot.com/2016/05/controlling-tp-link-hs100-wi-fi-smart.html
