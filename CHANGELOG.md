# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [5.0.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v4.0.1...v5.0.0) (2020-01-09)


### ⚠ BREAKING CHANGES

* Requires Node v10 or later

### Features

* stop discovery on homebridge shutdown ([e138b42](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/e138b42a353d03d0882ca4ef94c74a42608b82c2))
* upgrade to tplink-smarthome-api v2 ([35264b7](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/35264b78734f4ddffad1cc68526eeecd6ce7ee50))


### Bug Fixes

* broadcast config option not being set properly ([7ff7886](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/7ff78863146938f67f724be2ca7f8bf17e067718)), closes [#96](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/96)

<a name="4.0.1"></a>
## [4.0.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v4.0.0...v4.0.1) (2019-02-13)


### Bug Fixes

* identify regression ([2cf302e](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/2cf302e))
* lightbulb regressions ([3a3143d](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/3a3143d))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.14.1...v4.0.0) (2019-02-12)


### Bug Fixes

* regression of addCustomCharacteristics ([e087be5](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/e087be5))


### Chores

* set minimum node version to v8.3.0 ([e6abcf2](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/e6abcf2))


### BREAKING CHANGES

* minimum node version supported >=v8.3.0



<a name="3.14.1"></a>
## [3.14.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.14.0...v3.14.1) (2019-01-23)


### Bug Fixes

* update require for new index.js location ([9894520](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/9894520))



<a name="3.14.0"></a>
# [3.14.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.13.0...v3.14.0) (2019-01-23)


### Bug Fixes

* **lightbulb:** check for non-zero color_temp ([8acf6e1](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/8acf6e1))
* **lightbulb:** incorrectly testing for Hue instead of Saturation ([a823b54](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/a823b54))


### Features

* **outlet:** update energy characteristics automatically ([83c524f](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/83c524f))



<a name="3.13.0"></a>
# [3.13.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.12.0...v3.13.0) (2019-01-17)


### Bug Fixes

* correctly pass timeout to Client / Device ([1481b8b](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/1481b8b))


### Features

* add HS210 to switch model list ([a247574](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/a247574))
* skip unsupported devices ([#77](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/77)) ([1faafbf](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/1faafbf)), closes [#68](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/68)



<a name="3.12.0"></a>
# [3.12.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.11.1...v3.12.0) (2019-01-11)


### Bug Fixes

* treat HS220 as a switch by default ([9e828b3](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/9e828b3))


### Features

* add `excludeMacAddresses` configuration ([37d3ca4](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/37d3ca4))
* add support for HS300/HS107 multi-outlet devices ([325b1f8](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/325b1f8))



<a name="3.11.1"></a>
## [3.11.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v3.7.0...v3.11.1) (2018-12-03)


### Bug Fixes

* increase default timeout to 15 seconds ([c433727](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/c433727))
* support new-style energy consumption ([315ee99](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/315ee99)), closes [#57](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/57)
* upgrade dependencies ([7453ac9](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/7453ac9))
