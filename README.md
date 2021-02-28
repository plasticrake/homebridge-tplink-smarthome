<!-- markdownlint-disable MD033 -->

# homebridge-tplink-smarthome

[![NPM Version](https://img.shields.io/npm/v/homebridge-tplink-smarthome.svg)](https://www.npmjs.com/package/homebridge-tplink-smarthome)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

TPLink Smart Home Plugin for [Homebridge](https://github.com/nfarina/homebridge). (formerly `homebridge-hs100`)

## Models Supported

- **Plugs:** HS100, HS103, HS105, HS107, HS110, HS300, KP105, KP303, KP400
- **Switches:** HS200, HS210, HS220
- **Bulbs:** LB100, LB110, LB120, LB130, LB200, LB230

More models may be supported than listed. If you have another model working please let me know so I can add here.

## HomeKit

| Model                                           | Service   | Characteristics                                                                                                                                                                                    |
| ----------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HS100, HS103, HS105, HS107, KP105, KP303, KP400 | Outlet    | On<br/>OutletInUse (based on On state)                                                                                                                                                             |
| HS110, HS300, KP115                             | Outlet    | On<br/>OutletInUse (based on energy monitoring)<br/>Volts (Custom)<br/>Amperes (Custom)<br/>Watts (Custom)<br/>VoltAmperes (Custom)<br/>KilowattHours (Custom)<br/>KilowattVoltAmpereHour (Custom) |
| HS200, HS210                                    | Switch    | On                                                                                                                                                                                                 |
| HS220                                           | Lightbulb | On<br/>Brightness                                                                                                                                                                                  |
| LB100, LB110, LB200                             | Lightbulb | On<br/>Brightness<br/>Watts (Custom)                                                                                                                                                               |
| LB120                                           | Lightbulb | On<br/>Brightness<br/>ColorTemperature<br/>Watts (Custom)                                                                                                                                          |
| LB130, LB230                                    | Lightbulb | On<br/>Brightness<br/>ColorTemperature<br/>Hue<br/>Saturation<br/>Watts (Custom)                                                                                                                   |

## Installation

### Manual Installation

1. **Node v10 or greater is required.** Check by running: `node --version`
2. Install Homebridge using: `npm install -g homebridge` or `sudo npm install -g --unsafe-perm homebridge` ([more details](https://github.com/nfarina/homebridge#installation))
3. **Homebridge v1.1.0 or greater is required.** Check by running `homebridge --version`
4. Install this plugin using: `npm install -g homebridge-tplink-smarthome`
5. Update your configuration file. See the sample below.

### Homebridge Config UI X Installation

Check out [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) for easier setup. This plugin can be installed from the **Plugins** tab by searching.

## Updating

- `npm update -g homebridge-tplink-smarthome`

## Configuration

### Sample Configuration

#### Minimal

Most setups do not require any other configuration to get up and runing.

```json
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome"
}]
```

#### All options with defaults

See [config.ts](src/config.ts) for documention on these options. It is recommended to use [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) to setup the configuration if you don't want to manually edit JSON files.

```json
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome",

  "addCustomCharacteristics": true,
  "inUseThreshold": 0,
  "switchModels": ["HS200", "HS210"],

  "discoveryPort": 0,
  "broadcast": "255.255.255.255",
  "pollingInterval": 10,
  "deviceTypes": ["bulb", "plug"],
  "macAddresses": undefined,
  "excludeMacAddresses": undefined,
  "devices": undefined,

  "timeout": 15,
  "transport": 'tcp',
  "waitTimeUpdate": 100
}]
```

##### MAC Addresses

MAC Addresses are normalized, special characters are removed and made uppercase for comparison. So any format should work: `AA:BB:CC:00:11:22` or `aaBbcc001122` are valid. Glob-style pattern matching is supported: `?` will match a single character and `*` matches zero or more. To specify all MAC addresses that start with `AA` you could use `AA*`

<img src="https://user-images.githubusercontent.com/1383980/30236344-5ca0e866-94cc-11e7-9cf7-bb5632291082.png" align="right" alt="Eve Screenshot - Custom Characteristics" width=250>

### Custom Characteristics in Eve

Devices that support energy monitoring (HS110, etc) will have extra characteristics that are viewable in the Eve app (such as Watts). Turn this off by setting `addCustomCharacteristics` false. When this is on, you will see warnings on startup that you can ignore.

```text
HAP Warning: Characteristic E863F10D-079E-48FF-8F27-9C2605A29F52 not in required or optional characteristics for service 00000047-0000-1000-8000-0026BB765291. Adding anyway.
```

### Discovery and Broadcast

This plugin uses UDP broadcast to find devices on your network. This is also how the Kasa app finds devices. Try setting the `broadcast` configuration if you're having discovery issues. Some users have reported that rebooting their router or changing some router settings have fixed discovery issues.

### Manually Specifying Devices

If you have a network setup where UDP broadcast is not working, you can manually specify the devices you'd like this plugin to use. This will send the discovery message directly to these devices in addition to the UDP broadcast. **Note that your device must have a static IP to work.**

```js
"platforms": [{
  "platform": "TplinkSmarthome",
  "name": "TplinkSmarthome",

  "devices": [
    { "host": "192.168.0.100" },
    { "host": "192.168.0.101" },
    { "host": "192.168.0.102", "port": "9999" } // port defaults to "9999" but can be overriden
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

Thanks to George Georgovassilis and Thomas Baust for [reverse engineering the HS1XX protocol](https://blog.georgovassilis.com/2016/05/07/controlling-the-tp-link-hs100-wi-fi-smart-plug/).
