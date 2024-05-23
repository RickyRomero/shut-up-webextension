## Shut Up

[![Crowdin](https://badges.crowdin.net/shut-up-comment-blocker/localized.svg)](https://crowdin.com/project/shut-up-comment-blocker)

[Shut Up][homepage] is an open source project for blocking comment sections in all mainstream web browsers.

This is the [WebExtension][webextensions-mdn] version of Shut Up which supports Chrome, Firefox, Edge, and Opera. Versions for Safari on [macOS,][shut-up-native] [iOS, and iPadOS][shut-up-ios] are also available.

This extension leverages [shutup.css][shutup-css] by [Steven Frank][site-steven] and contributors, which is used with permission.

If you have a Crowdin account, [please consider contributing a localization!][crowdin] Your help could make the difference between someone being able to use this extension or not. Thank you.

## Installation

If you're simply looking to *install* Shut Up, these are the links you're looking for:

* [Shut Up for Chrome][ext-chrome]
* [Shut Up for Safari][ext-safari] (Shared link for macOS, iOS, and iPadOS)
* [Shut Up for Firefox][ext-firefox]
* [Shut Up for Edge][ext-edge]
* [Shut Up for Opera][ext-opera]

## Development

There are three ways to run the extension as a developer, depending on what you want to do:

### Basic development in Chrome

If you only want to test in Chrome, navigate to `chrome://extensions` and turn on "Developer mode." Then load the `src` folder as an unpacked extension.

### Chrome and Firefox development

If you're on a Mac and you want to develop in Chrome and Firefox simultaneously, do this:

```zsh
cd shut-up-webextension
yarn
yarn dev
```

This script will place a folder on your Desktop called `Shut Up Test Extensions`. Inside those are separate `chrome` and `firefox` folders. It will watch the source folder, copying any changes to those `chrome` and `firefox` folders simultaneously.

- To test in Chrome, follow the instructions in the previous section, but load the extension from the `chrome` folder instead.
- To test in Firefox, navigate to `about:debugging#/runtime/this-firefox`. Click "Load Temporary Add-On…", navigate to to the `firefox` folder, and load `manifest.json`.

The script is necessary because we need separate `manifest.json` files for Chrome and Firefox, and there's no way to tell these browsers which manifest to load.

### Developing for Firefox on Android

First, run these commands on your Mac:

```zsh
cd shut-up-webextension
yarn
mv src/manifest.json src/manifest.json.bak
mv src/manifest.ffx.json src/manifest.json
```

Next, [follow the guide here.](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)

When you get to the step where you run `web-ext`, you will need to modify the command slightly.

```zsh
yarn web-ext run -t firefox-android --adb-device DEVICE_ID --firefox-apk org.mozilla.firefox -s ./src
```

This command will run `web-ext` from `node_modules`, pointing it at the `./src` directory. Replace `DEVICE_ID` with the ID of the Android phone or simulated device you want to try. If you want to run a different version of Firefox, use one of these IDs:

- Firefox Stable: `org.mozilla.firefox`
- Firefox Beta: `org.mozilla.firefox_beta`
- Firefox Nightly: `org.mozilla.fenix`

## Minimum Requirements

This version of Shut Up is known to work in the following browser releases:

* Chrome 123 or later
* Firefox 124 or later
* Edge 120 or later
* Brave 1.65.130 or later
* Opera 109 or later

## License

Shut Up, with the exception of [shutup.css][shutup-css], is available under the terms of the [MIT License.][license]



[homepage]: https://rickyromero.com/shutup/  (Shut Up Homepage)
[shut-up-native]: https://github.com/RickyRomero/shut-up-native  (macOS version of Shut Up)
[shut-up-ios]: https://github.com/RickyRomero/shut-up-ios  (iOS/iPadOS version of Shut Up)
[license]: LICENSE.md  (MIT License)
[shutup-css]: https://github.com/panicsteve/shutup-css  (shutup-css on GitHub)
[webextensions-mdn]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions  (WebExtensions documentation on MDN)
[site-steven]: https://stevenf.com  (Steven Frank's personal website)
[crowdin]: https://crowdin.com/project/shut-up-comment-blocker (Shut Up on Crowdin)

[ext-chrome]: https://chrome.google.com/webstore/detail/oklfoejikkmejobodofaimigojomlfim?hl=en-US&amp;gl=US  (Shut Up on the Chrome Web Store)
[ext-safari]: https://apps.apple.com/app/id1015043880  (Shut Up on the App Store)
[ext-firefox]: https://addons.mozilla.org/en-US/firefox/addon/shut-up-comment-blocker/  (Shut Up at Firefox Add-ons)
[ext-edge]: https://microsoftedge.microsoft.com/addons/detail/giifliakcgfijgkejmenachfdncbpalp  (Shut Up at Edge Add-ons)
[ext-opera]: https://github.com/panicsteve/shutup-css#installation-on-opera  (Installation on Opera)
