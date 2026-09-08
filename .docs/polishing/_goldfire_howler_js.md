### Installation

Source: https://context7.com/goldfire/howler.js/llms.txt

Instructions on how to install Howler.js using NPM, Yarn, or by including it via a script tag or ES6 module import.

```APIDOC
## Installation

### Installing via NPM or Yarn

```bash
# Using npm
npm install howler

# Using yarn
yarn add howler
```

### Browser Script Tag

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
```

### ES6 Module Import

```javascript
import { Howl, Howler } from 'howler';
```

### CommonJS Require

```javascript
const { Howl, Howler } = require('howler');
```
```

--------------------------------

### Core Initialization and Playback

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Demonstrates how to initialize a sound with basic options and play it.

```APIDOC
## Basic Sound Initialization and Playback

### Description
This example shows the most basic usage of howler.js: initializing a sound with a source file and playing it.

### Method
`new Howl(options)`

### Endpoint
N/A (Client-side JavaScript library)

### Parameters
#### Request Body (Options for Howl constructor)
- **src** (string or array of strings) - Required - The path to the audio file(s).
- **autoplay** (boolean) - Optional - Whether to play the sound immediately upon loading.
- **loop** (boolean) - Optional - Whether to loop the sound.
- **volume** (number) - Optional - The volume of the sound, from 0.0 to 1.0.
- **onend** (function) - Optional - Callback function to execute when the sound finishes playing.

### Request Example
```javascript
var sound = new Howl({
  src: ['sound.mp3']
});

sound.play();
```

### Response
#### Success Response (N/A - Client-side execution)
This is a client-side library, so there are no server responses to document in this context. The `Howl` object is created and methods are called directly.

#### Response Example
N/A
```

--------------------------------

### Playback Control

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Methods for loading, playing, and unloading audio.

```APIDOC
## load()

### Description
This is called by default, but if you set `preload` to false, you must call `load` before you can play any sounds.

## unload()

### Description
Unload and destroy a Howl object. This will immediately stop all sounds attached to this sound and remove it from the cache.
```

--------------------------------

### Global Methods

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Methods that control all sounds globally.

```APIDOC
### Global Methods

The following methods are used to modify all sounds globally, and are called from the `Howler` object.

#### mute(muted)

### Description
Mute or unmute all sounds.

### Parameters
#### Path Parameters
* **muted** (Boolean) - Required - True to mute and false to unmute.

#### volume([volume])

### Description
Get/set the global volume for all sounds, relative to their own volume.

### Parameters
#### Path Parameters
* **volume** (Number) - Optional - Volume from `0.0` to `1.0`.

#### stop()

### Description
Stop all sounds and reset their seek position to the beginning.

#### codecs(ext)

### Description
Check supported audio codecs. Returns `true` if the codec is supported in the current browser.

### Parameters
#### Path Parameters
* **ext** (String) - Required - File extension. One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav", "aac", "caf", "m4a", "m4b", "mp4", "weba", "webm", "dolby", "flac".

#### unload()

### Description
Unload and destroy all currently loaded Howl objects. This will immediately stop all sounds and remove them from cache.
```

--------------------------------

### Event Handlers

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Callbacks for various audio events.

```APIDOC
## Event: onplayerror

### Description
Fires when the sound is unable to play. The first parameter is the ID of the sound and the second is the error message/code.

## Event: onplay

### Description
Fires when the sound begins playing. The first parameter is the ID of the sound.

## Event: onend

### Description
Fires when the sound finishes playing (if it is looping, it'll fire at the end of each loop). The first parameter is the ID of the sound.

## Event: onpause

### Description
Fires when the sound has been paused. The first parameter is the ID of the sound.

## Event: onstop

### Description
Fires when the sound has been stopped. The first parameter is the ID of the sound.

## Event: onmute

### Description
Fires when the sound has been muted/unmuted. The first parameter is the ID of the sound.

## Event: onvolume

### Description
Fires when the sound's volume has changed. The first parameter is the ID of the sound.

## Event: onrate

### Description
Fires when the sound's playback rate has changed. The first parameter is the ID of the sound.

## Event: onseek

### Description
Fires when the sound has been seeked. The first parameter is the ID of the sound.

## Event: onfade

### Description
Fires when the current sound finishes fading in/out. The first parameter is the ID of the sound.

## Event: onunlock

### Description
Fires when audio has been automatically unlocked through a touch/click event.
```
