# homebridge-hs100
[![NPM Version](https://img.shields.io/npm/v/homebridge-hs100.svg)](https://www.npmjs.com/package/homebridge-hs100)

TPLink HS100/HS110 WiFi Smart Plug plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-hs100`
3. Update your configuration file. See the sample below.

# Updating

- `npm update -g homebridge-hs100`

# Configuration

## Sample Configuration

Configuration for 3 bulbs. Name defaults to the name set in the Kasa app but can be overridden here.
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
        "name": "My Custom Name",
        "host": "10.0.1.4",
        "port": 9999
    }]
}],
```

## Credits
Thanks to George Georgovassilis and Thomas Baust for reverse engineering the HS1XX protocol.
https://georgovassilis.blogspot.com/2016/05/controlling-tp-link-hs100-wi-fi-smart.html
