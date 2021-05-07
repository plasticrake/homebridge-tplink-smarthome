# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [6.4.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.4.0-beta.1...v6.4.0) (2021-05-07)


### Features

* configuration validation messages ([#195](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/195)) ([86b2bd2](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/86b2bd2c8c52eb5042d19c5d6a65e357cbbf462b))

## [6.4.0-beta.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.4.0-beta.0...v6.4.0-beta.1) (2021-03-25)


### Bug Fixes

* UnhandledPromiseRejectionWarning on log ([58d9444](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/58d944496e66b8c64ccaee2a4b010913882dff79)), closes [#189](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/189)

## [6.4.0-beta.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.3.0...v6.4.0-beta.0) (2021-03-25)


### Features

* emeter polling more friendly with multi-outlet plugs ([#190](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/190)) ([65b5865](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/65b5865607ad3158e57228edcb7be389c80402a4))

## [6.3.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.2.0...v6.3.0) (2021-03-05)


### Features

* change characteristic getters to use cached values ([#183](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/183)) ([8024dcc](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/8024dcc7ed14d05cedbb288393f9ed4766be6b26))

## [6.3.0-beta.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.2.0...v6.3.0-beta.0) (2021-03-01)


### Features

* change characteristic getters to use cached values ([1db2c6f](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/1db2c6fa04abf5a7bd7f271952e7939d28d52977))

## [6.2.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.2.0-beta.0...v6.2.0) (2021-03-01)

## [6.2.0-beta.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.1.0...v6.2.0-beta.0) (2021-02-28)


### Features

* add discoveryPort configuration option ([#159](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/159))  ([eb13885](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/eb13885826d7241e45249ad93b339253d011d2e2))
* change "Apprent Power" to float ([255d552](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/255d55226d0ed2248ed2063ea68788e7bb27f497))
* logging improvements ([3105f31](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/3105f31172d4f110805456e1ec5f909a31d9524d))


### Bug Fixes

* don't update color temperature when 0 ([738aeed](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/738aeed91fd2217aa9eb56ae15de6964b7495334)), closes [#180](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/180)
* warning for "Apparent Power" characteristic ([3aa6b29](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/3aa6b2966c7ac62ff5bb3e5f4e28ae189f17101c))

## [6.1.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.0.1...v6.1.0) (2020-10-20)


### Features

* add identify functionality to bulbs ([0259e5e](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/0259e5ed9609c65b83b2a0bbbc35efdf3dda31a7))


### Bug Fixes

* case typo preventing saturation updates ([178df30](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/178df30e310c5c151894fafba5040ffb2778967f))
* identify not working ([8b151e9](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/8b151e98915e326c2e0e76cda47f2eaa87199d90))
* return last known or default values for characteristics ([59838ea](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/59838eacb2a7016ec10979075a724ad82be9d2e9))

### [6.0.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v6.0.0...v6.0.1) (2020-10-19)


### Bug Fixes

* don't add OutletInUse for SWITCH types ([59e9f42](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/59e9f42532b863766c70d289619ab8f20e01a760)), closes [#146](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/146)

## [6.0.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.2.0...v6.0.0) (2020-10-14)


### Bug Fixes

* only add energy characteristics if configured ([52705a6](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/52705a69090c98f1dbc55adea2c0a4ceb5253429)), closes [#144](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/144)

## [5.2.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.2.0-beta.1...v5.2.0) (2020-10-13)

## [5.2.0-beta.1](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.2.0-beta.0...v5.2.0-beta.1) (2020-10-13)


### Features

* improve homebridge-config-ui-x configuration ([#142](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/142)) ([f7a157d](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/f7a157d350fadbe5a1c1164ae0cda19599339a3f))

## [5.2.0-beta.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.1.1-beta.0...v5.2.0-beta.0) (2020-10-12)


### Features

* combine and batch requests to devices ([#141](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/141)) ([6d6076c](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/6d6076c9dce70b7038d98b850f0c25287a665a41))


### Bug Fixes

* characteristics not being updated ([5351c58](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/5351c58d33072baa6bafbb907ebfc6cb84dcb715))

### [5.1.1-beta.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.1.0...v5.1.1-beta.0) (2020-10-11)

## [5.1.0](https://github.com/plasticrake/homebridge-tplink-smarthome/compare/v5.0.0...v5.1.0) (2020-05-13)


### Features

* add config.schema.json ([#109](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/109)) ([b98dd5b](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/b98dd5b55e170f6d38a628943db8a8cef0938b42))


### Bug Fixes

* add missing require()s for characteristics ([#117](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/117)) ([14a3963](https://github.com/plasticrake/homebridge-tplink-smarthome/commit/14a39632c2ebe89ded14ae289c1a74f668506d1c)), closes [#110](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/110) [#111](https://github.com/plasticrake/homebridge-tplink-smarthome/issues/111)

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
