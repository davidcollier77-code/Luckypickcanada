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

### Install Howler.js via NPM or Yarn

Source: https://context7.com/goldfire/howler.js/llms.txt

Demonstrates how to install the Howler.js library using package managers like NPM or Yarn.

```bash
# Using npm
npm install howler

# Using yarn
yarn add howler
```

--------------------------------

### Play Sound and Manage Instances

Source: https://context7.com/goldfire/howler.js/llms.txt

Demonstrates how to start playback of a sound using the `play()` method, retrieve a unique sound ID, and resume paused instances.

```javascript
const sound = new Howl({
  src: ['background-music.webm', 'background-music.mp3']
});

// Play and get the sound ID
const id = sound.play();
console.log('Now playing sound ID:', id);

// Resume a paused sound by passing its ID
sound.pause(id);
setTimeout(() => {
  sound.play(id);  // Resume the same sound instance
}, 2000);

// Play a specific sprite
const gameSound = new Howl({
  src: ['sprites.webm', 'sprites.mp3'],
  sprite: {
    jump: [0, 500],
    coin: [1000, 300],
    explosion: [2000, 1500]
  }
});

const jumpId = gameSound.play('jump');
const coinId = gameSound.play('coin');
```

--------------------------------

### play() Method

Source: https://context7.com/goldfire/howler.js/llms.txt

Starts or resumes playback of a sound. Returns a unique sound ID for controlling specific instances.

```APIDOC
## play()

Begins playback of a sound or resumes a paused sound. Returns a unique sound ID that can be used to control this specific instance.

```javascript
const sound = new Howl({
  src: ['background-music.webm', 'background-music.mp3']
});

// Play and get the sound ID
const id = sound.play();
console.log('Now playing sound ID:', id);

// Resume a paused sound by passing its ID
sound.pause(id);
setTimeout(() => {
  sound.play(id);  // Resume the same sound instance
}, 2000);

// Play a specific sprite
const gameSound = new Howl({
  src: ['sprites.webm', 'sprites.mp3'],
  sprite: {
    jump: [0, 500],
    coin: [1000, 300],
    explosion: [2000, 1500]
  }
});

const jumpId = gameSound.play('jump');
const coinId = gameSound.play('coin');
```
```

--------------------------------

### Configure Howl Constructor Options

Source: https://context7.com/goldfire/howler.js/llms.txt

Provides an example of initializing a new Howl audio object with various configuration options, including sources, volume, playback behavior, and event callbacks.

```javascript
const sound = new Howl({
  src: ['sound.webm', 'sound.mp3'],  // Audio sources in order of preference
  volume: 0.5,                        // Volume from 0.0 to 1.0
  html5: false,                       // Force HTML5 Audio (for streaming)
  loop: false,                        // Loop playback
  preload: true,                      // Auto-load on creation
  autoplay: false,                    // Auto-play when loaded
  mute: false,                        // Start muted
  rate: 1.0,                          // Playback rate (0.5 to 4.0)
  pool: 5,                            // Inactive sound pool size
  format: ['webm', 'mp3'],            // Explicit format specification

  // XHR configuration for Web Audio
  xhr: {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    },
    withCredentials: true
  },

  // Event callbacks
  onload: function() {
    console.log('Sound loaded!');
  },
  onloaderror: function(id, error) {
    console.error('Load error:', error);
  },
  onplayerror: function(id, error) {
    console.error('Play error:', error);
  },
  onplay: function(id) {
    console.log('Playing sound ID:', id);
  },
  onend: function(id) {
    console.log('Sound finished:', id);
  },
  onpause: function(id) {
    console.log('Sound paused:', id);
  },
  onstop: function(id) {
    console.log('Sound stopped:', id);
  },
  onmute: function(id) {
    console.log('Mute changed:', id);
  },
  onvolume: function(id) {
    console.log('Volume changed:', id);
  },
  onrate: function(id) {
    console.log('Rate changed:', id);
  },
  onseek: function(id) {
    console.log('Seek position changed:', id);
  },
  onfade: function(id) {
    console.log('Fade complete:', id);
  },
  onunlock: function() {
    console.log('Audio unlocked on mobile');
  }
});
```

--------------------------------

### Streaming Audio

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Example of how to enable HTML5 audio for streaming larger files or live audio.

```APIDOC
## Streaming Audio with HTML5 Fallback

### Description
This example demonstrates how to force howler.js to use the HTML5 Audio element for streaming, which is useful for live audio or very large files.

### Method
`new Howl(options)`

### Endpoint
N/A (Client-side JavaScript library)

### Parameters
#### Request Body (Options for Howl constructor)
- **src** (string or array of strings) - Required - The path to the audio file(s).
- **html5** (boolean) - Required - Set to `true` to force the use of HTML5 Audio.

### Request Example
```javascript
var sound = new Howl({
  src: ['stream.mp3'],
  html5: true
});

sound.play();
```

### Response
#### Success Response (N/A - Client-side execution)
N/A

#### Response Example
N/A
```

--------------------------------

### Sound Sprite Usage

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Example of defining and playing specific segments of an audio file using sound sprites.

```APIDOC
## Sound Sprite Definition and Playback

### Description
This example shows how to define a sound sprite, which allows you to play specific sections of a single audio file by providing start and end times.

### Method
`new Howl(options)`

### Endpoint
N/A (Client-side JavaScript library)

### Parameters
#### Request Body (Options for Howl constructor)
- **src** (string or array of strings) - Required - The path to the audio file(s).
- **sprite** (object) - Required - An object where keys are sprite names and values are arrays containing the start and end time (in milliseconds) for that sprite.

### Request Example
```javascript
var sound = new Howl({
  src: ['sounds.webm', 'sounds.mp3'],
  sprite: {
    blast: [0, 3000],
    laser: [4000, 1000],
    winner: [6000, 5000]
  }
});

// Shoot the laser!
sound.play('laser');
```

### Response
#### Success Response (N/A - Client-side execution)
N/A

#### Response Example
N/A
```

--------------------------------

### Seek Playback Position with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Demonstrates getting and setting the current playback position in seconds for audio files.

```javascript
const sound = new Howl({
  src: ['podcast.webm', 'podcast.mp3'],
  html5: true
});

const id = sound.play();

// Seek to a specific position (30 seconds)
sound.seek(30, id);

// Skip forward 10 seconds
const current = sound.seek(id);
sound.seek(current + 10, id);
```

--------------------------------

### Manage Sound Volume with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Demonstrates how to get and set the volume for both an entire Howl group and individual sound instances. Values range from 0.0 to 1.0.

```javascript
const sound = new Howl({
  src: ['audio.webm', 'audio.mp3'],
  volume: 0.8
});

const id = sound.play();

// Get group volume
console.log('Group volume:', sound.volume());  // 0.8

// Set group volume (affects all sounds)
sound.volume(0.5);

// Get specific sound's volume
console.log('Sound volume:', sound.volume(id));

// Set specific sound's volume
sound.volume(0.3, id);

// Get and set dynamically
let currentVolume = sound.volume();
sound.volume(Math.min(1, currentVolume + 0.1));
```

--------------------------------

### Implement Sound Sprites

Source: https://context7.com/goldfire/howler.js/llms.txt

Groups multiple audio clips into a single file, allowing efficient playback of specific segments defined by start time and duration.

```javascript
const gameAudio = new Howl({
  src: ['game-sprites.webm', 'game-sprites.mp3'],
  sprite: {
    shoot: [0, 300],
    explosion: [500, 1200],
    powerup: [2000, 800],
    music: [3000, 15000, true],
    jump: [20000, 400],
    coinCollect: [21000, 250]
  }
});

// Play specific sprites
const shootId = gameAudio.play('shoot');
const explosionId = gameAudio.play('explosion');

// Control individual sprite instances
const musicId = gameAudio.play('music');
gameAudio.volume(0.3, musicId);

// Stop specific sprite while others continue
gameAudio.stop(musicId);
```

--------------------------------

### duration() - Get Audio Duration

Source: https://context7.com/goldfire/howler.js/llms.txt

Returns the duration of the audio source in seconds. Returns sprite duration when a sound ID is passed.

```APIDOC
## duration()

### Description
Returns the duration of the audio source in seconds. Returns sprite duration when a sound ID is passed.

### Method
`Howl.prototype.duration([id])`

### Parameters
#### Query Parameters
- **id** (Number) - Optional - The ID of the sound instance. If not provided, returns the total duration of the audio source. If provided, returns the duration of the specific sprite or sound instance.

### Request Example
```javascript
const sound = new Howl({
  src: ['track.webm', 'track.mp3']
});

sound.once('load', function() {
  console.log('Total duration:', sound.duration(), 'seconds');
});

// With sprites, get sprite duration
const spriteSound = new Howl({
  src: ['effects.webm', 'effects.mp3'],
  sprite: {
    short: [0, 500],      // 0.5 seconds
    medium: [1000, 2000], // 2 seconds
    long: [4000, 5000]    // 5 seconds
  }
});

spriteSound.once('load', function() {
  console.log('Full duration:', spriteSound.duration());  // Total file duration

  const shortId = spriteSound.play('short');
  console.log('Short sprite duration:', spriteSound.duration(shortId));  // 0.5
});
```

### Response
#### Success Response (200)
- **Number**: The duration of the audio in seconds.
```

--------------------------------

### Implement Audio Fading with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Provides examples of fading audio volumes over a specific duration, including crossfading between two distinct sounds.

```javascript
const sound = new Howl({
  src: ['music.webm', 'music.mp3'],
  volume: 1.0
});

const id = sound.play();

// Fade out over 2 seconds
sound.fade(1.0, 0, 2000, id);

// Crossfade between two sounds
const fadeOut = new Howl({ src: ['old.mp3'], volume: 1.0 });
const fadeIn = new Howl({ src: ['new.mp3'], volume: 0 });

const oldId = fadeOut.play();
const newId = fadeIn.play();

fadeOut.fade(1.0, 0, 3000, oldId);
fadeIn.fade(0, 1.0, 3000, newId);
```

--------------------------------

### Handle Playback Errors and Unlock Events in Howler.js

Source: https://github.com/goldfire/howler.js/blob/master/README.md

This example demonstrates how to handle audio playback errors on mobile devices. It listens for a 'playerror' event and then waits for the 'unlock' event to retry playing the audio. This is a common pattern for ensuring audio plays after user interaction.

```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3'],
  onplayerror: function() {
    sound.once('unlock', function() {
      sound.play();
    });
  }
});

sound.play();
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

### Advanced Playback Configuration

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Demonstrates advanced settings including autoplay, looping, volume control, and event callbacks.

```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3', 'sound.wav'],
  autoplay: true,
  loop: true,
  volume: 0.5,
  onend: function() {
    console.log('Finished!');
  }
});
```

--------------------------------

### Advanced Playback Options

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Shows how to configure multiple playback options like autoplay, loop, volume, and event callbacks.

```APIDOC
## Advanced Playback Options

### Description
This example illustrates setting multiple playback properties for a sound, including automatic playback, looping, volume control, and defining an event handler for when the sound finishes.

### Method
`new Howl(options)`

### Endpoint
N/A (Client-side JavaScript library)

### Parameters
#### Request Body (Options for Howl constructor)
- **src** (string or array of strings) - Required - The path to the audio file(s).
- **autoplay** (boolean) - Optional - If `true`, the sound will begin playing as soon as it is decoded.
- **loop** (boolean) - Optional - If `true`, the sound will loop indefinitely.
- **volume** (number) - Optional - The volume of the sound, ranging from 0.0 to 1.0.
- **onend** (function) - Optional - A callback function that is executed when the sound finishes playing.

### Request Example
```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3', 'sound.wav'],
  autoplay: true,
  loop: true,
  volume: 0.5,
  onend: function() {
    console.log('Finished!');
  }
});
```

### Response
#### Success Response (N/A - Client-side execution)
N/A

#### Response Example
N/A
```

--------------------------------

### Initialize howler.js in Browser

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Demonstrates how to include the library via script tag and initialize a new Howl instance with multiple source formats for cross-browser compatibility.

```html
<script src="/path/to/howler.js"></script>
<script>
    var sound = new Howl({
      src: ['sound.webm', 'sound.mp3']
    });
</script>
```

--------------------------------

### Configure XHR Requests

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Shows how to customize XHR requests for Web Audio loading, including setting custom headers, HTTP methods, and credentials.

```javascript
// Using each of the properties.
new Howl({
  xhr: {
    method: 'POST',
    headers: {
      Authorization: 'Bearer:' + token,
    },
    withCredentials: true,
  }
});

// Only changing the method.
new Howl({
  xhr: {
    method: 'POST',
  }
});
```

--------------------------------

### Control Multiple Sound Instances

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Shows how to manage individual sound instances using unique IDs returned by the play method. This allows for independent control over properties like fade and playback rate.

```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3']
});

// Play returns a unique Sound ID that can be passed
// into any method on Howl to control that specific sound.
var id1 = sound.play();
var id2 = sound.play();

// Fade out the first sound and speed up the second.
sound.fade(1, 0, 1000, id1);
sound.rate(1.5, id2);
```

--------------------------------

### Basic Audio Playback

Source: https://github.com/goldfire/howler.js/blob/master/README.md

The simplest implementation to load an MP3 file and trigger playback.

```javascript
var sound = new Howl({
  src: ['sound.mp3']
});

sound.play();
```

--------------------------------

### Use Howler.js with ES6 Modules

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Illustrates importing Howler.js using ES6 syntax and performing global volume adjustments alongside instance-specific playback.

```javascript
import {Howl, Howler} from 'howler';

// Setup the new Howl.
const sound = new Howl({
  src: ['sound.webm', 'sound.mp3']
});

// Play the sound.
sound.play();

// Change global volume.
Howler.volume(0.5);
```

--------------------------------

### Howl Constructor

Source: https://context7.com/goldfire/howler.js/llms.txt

Details on how to create a new Howl audio object with various configuration options and event callbacks.

```APIDOC
## Howl Constructor

The `Howl` class creates a new audio object with configurable options for sources, volume, playback behavior, and event callbacks.

```javascript
const sound = new Howl({
  src: ['sound.webm', 'sound.mp3'],  // Audio sources in order of preference
  volume: 0.5,                        // Volume from 0.0 to 1.0
  html5: false,                       // Force HTML5 Audio (for streaming)
  loop: false,                        // Loop playback
  preload: true,                      // Auto-load on creation
  autoplay: false,                    // Auto-play when loaded
  mute: false,                        // Start muted
  rate: 1.0,                          // Playback rate (0.5 to 4.0)
  pool: 5,                            // Inactive sound pool size
  format: ['webm', 'mp3'],            // Explicit format specification

  // XHR configuration for Web Audio
  xhr: {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token123'
    },
    withCredentials: true
  },

  // Event callbacks
  onload: function() {
    console.log('Sound loaded!');
  },
  onloaderror: function(id, error) {
    console.error('Load error:', error);
  },
  onplayerror: function(id, error) {
    console.error('Play error:', error);
  },
  onplay: function(id) {
    console.log('Playing sound ID:', id);
  },
  onend: function(id) {
    console.log('Sound finished:', id);
  },
  onpause: function(id) {
    console.log('Sound paused:', id);
  },
  onstop: function(id) {
    console.log('Sound stopped:', id);
  },
  onmute: function(id) {
    console.log('Mute changed:', id);
  },
  onvolume: function(id) {
    console.log('Volume changed:', id);
  },
  onrate: function(id) {
    console.log('Rate changed:', id);
  },
  onseek: function(id) {
    console.log('Seek position changed:', id);
  },
  onfade: function(id) {
    console.log('Fade complete:', id);
  },
  onunlock: function() {
    console.log('Audio unlocked on mobile');
  }
});
```
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

--------------------------------

### Event Listeners: on(), once(), off()

Source: https://context7.com/goldfire/howler.js/llms.txt

Methods for attaching, removing, and handling events on sound playback.

```APIDOC
## on() / once() / off()

### Description
Event listener methods for attaching, removing, and handling events on sound playback.

### Methods
- `Howl.prototype.on(event, callback[, id][, once])`
- `Howl.prototype.once(event, callback[, id])`
- `Howl.prototype.off(event[, callback][, id])`

### Parameters
#### on() / once()
- **event** (String) - The name of the event to listen for (e.g., 'play', 'end', 'load').
- **callback** (Function) - The function to execute when the event is triggered.
- **id** (Number) - Optional - The ID of the sound instance to listen to. If not provided, the event listener is attached to all instances.
- **once** (Boolean) - Optional (for `on()` only) - If `true`, the listener will be removed after the first trigger (equivalent to `once()`).

#### off()
- **event** (String) - The name of the event to remove listeners for.
- **callback** (Function) - Optional - The specific callback function to remove. If not provided, all listeners for the given event are removed.
- **id** (Number) - Optional - The ID of the sound instance to remove listeners from.

### Request Example
```javascript
const sound = new Howl({
  src: ['audio.webm', 'audio.mp3']
});

// Add persistent event listener
sound.on('play', function(id) {
  console.log('Sound started playing:', id);
});

sound.on('end', function(id) {
  console.log('Sound finished:', id);
});

// Add one-time event listener (automatically removed after first call)
sound.once('load', function() {
  console.log('Sound loaded!');
  sound.play();
});

// Listen to events for a specific sound ID
const id = sound.play();
sound.on('end', function(soundId) {
  console.log('This specific sound ended:', soundId);
}, id);

// Remove a specific event listener
function onPause(id) {
  console.log('Paused:', id);
}
sound.on('pause', onPause);
sound.off('pause', onPause);

// Remove all listeners of a type
sound.off('end');

// Remove all event listeners
sound.off();

// Available events: load, loaderror, playerror, play, end,
// pause, stop, mute, volume, rate, seek, fade, unlock
```

### Response
#### Success Response (200)
These methods do not return a value, but they manage event listeners.
```

--------------------------------

### load() / unload() - Audio Loading and Cleanup

Source: https://context7.com/goldfire/howler.js/llms.txt

Methods for manually controlling audio loading and memory cleanup.

```APIDOC
## load() / unload()

### Description
Methods for manually controlling audio loading and memory cleanup.

### Methods
- `Howl.prototype.load()`
- `Howl.prototype.unload()`

### Parameters
These methods do not accept any parameters.

### Request Example
```javascript
// Deferred loading
const sound = new Howl({
  src: ['large-audio.webm', 'large-audio.mp3'],
  preload: false
});

// Manually load when needed
document.getElementById('loadBtn').addEventListener('click', function() {
  sound.load();
});

sound.once('load', function() {
  console.log('Ready to play!');
});

// Unload to free memory
document.getElementById('cleanupBtn').addEventListener('click', function() {
  sound.unload();  // Stops all sounds and removes from cache
  console.log('Sound unloaded and memory freed');
});

// Preload metadata only (HTML5)
const podcast = new Howl({
  src: ['podcast.mp3'],
  preload: 'metadata',  // Load duration info without full download
  html5: true
});
```

### Response
#### Success Response (200)
These methods do not return a value, but initiate loading or unloading processes.
```

--------------------------------

### Monitor Audio State with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Illustrates how to check the loading state of a Howl instance and handle asynchronous loading events.

```javascript
const sound = new Howl({
  src: ['large-file.webm', 'large-file.mp3'],
  preload: false
});

sound.load();

sound.once('load', function() {
  console.log('Loaded state:', sound.state());
  sound.play();
});

// Check state before playing
if (sound.state() === 'loaded') {
  sound.play();
}
```

--------------------------------

### Global Listener Methods

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Methods for controlling the global audio listener position and orientation.

```APIDOC
## stereo(pan)

### Description
Helper method to update the stereo panning position of all current Howls.

### Parameters
- **pan** (Number) - Required - A value of -1.0 (left) to 1.0 (right).

## pos(x, y, z)

### Description
Get/set the position of the listener in 3D cartesian space.

## orientation(x, y, z, xUp, yUp, zUp)

### Description
Get/set the direction the listener is pointing in the 3D cartesian space using front and up vectors.
```

--------------------------------

### Control Loading and Memory with load() and unload()

Source: https://context7.com/goldfire/howler.js/llms.txt

Allows manual control over when audio files are loaded into memory and provides a mechanism to unload assets to free up system resources.

```javascript
const sound = new Howl({
  src: ['large-audio.webm', 'large-audio.mp3'],
  preload: false
});

// Manually load when needed
document.getElementById('loadBtn').addEventListener('click', function() {
  sound.load();
});

sound.once('load', function() {
  console.log('Ready to play!');
});

// Unload to free memory
document.getElementById('cleanupBtn').addEventListener('click', function() {
  sound.unload();
  console.log('Sound unloaded and memory freed');
});

// Preload metadata only
const podcast = new Howl({
  src: ['podcast.mp3'],
  preload: 'metadata',
  html5: true
});
```

--------------------------------

### Pause and Resume Sound Playback

Source: https://context7.com/goldfire/howler.js/llms.txt

Illustrates how to pause a specific sound instance using its ID or pause all sounds in a group by omitting the ID. Also shows how to check the current seek position.

```javascript
const sound = new Howl({
  src: ['music.webm', 'music.mp3']
});

const id = sound.play();

// Pause a specific sound by ID
setTimeout(() => {
  sound.pause(id);
  console.log('Sound paused at:', sound.seek(id), 'seconds');
}, 3000);

// Pause all sounds in the group (omit ID)
sound.pause();
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

### Spatial Plugin

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Options and methods for implementing 3D spatial audio.

```APIDOC
## Plugin: Spatial

### Options

#### orientation `Array` `[1, 0, 0]`
Sets the direction the audio source is pointing in the 3D cartesian coordinate space. Depending on how directional the sound is, based on the `cone` attributes, a sound pointing away from the listener can be quiet or silent.

#### stereo `Number` `null`
Sets the stereo panning value of the audio source for this sound or group. This makes it easy to setup left/right panning with a value of `-1.0` being far left and a value of `1.0` being far right.

#### pos `Array` `null`
Sets the 3D spatial position of the audio source for this sound or group relative to the global listener.

#### pannerAttr `Object`
Sets the panner node's attributes for a sound or group of sounds. See the `pannerAttr` method for all available options.

#### onstereo `Function`
Fires when the current sound has the stereo panning changed. The first parameter is the ID of the sound.

#### onpos `Function`
Fires when the current sound has the listener position changed. The first parameter is the ID of the sound.

#### onorientation `Function`
Fires when the current sound has the direction of the listener changed. The first parameter is the ID of the sound.

### Methods

#### stereo(pan, [id])

### Description
Get/set the stereo panning of the audio source for this sound or all in the group.

### Parameters
#### Path Parameters
* **pan** (Number) - Required - A value of `-1.0` is all the way left and `1.0` is all the way right.
* **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.
```

--------------------------------

### Build a Custom Audio Player Class

Source: https://context7.com/goldfire/howler.js/llms.txt

Provides a reusable AudioPlayer class that manages a playlist, track switching, playback controls, and progress tracking using requestAnimationFrame.

```javascript
class AudioPlayer {
  constructor(playlist) {
    this.playlist = playlist;
    this.index = 0;
    this.sounds = {};
  }

  play(index) {
    if (typeof index === 'number') this.index = index;
    const track = this.playlist[this.index];
    if (!this.sounds[track.file]) {
      this.sounds[track.file] = new Howl({
        src: [track.file + '.webm', track.file + '.mp3'],
        html5: true,
        onplay: () => this.updateProgress(),
        onend: () => this.next()
      });
    }
    this.current = this.sounds[track.file];
    this.current.play();
    return this.current;
  }

  seek(percentage) {
    if (this.current && this.current.playing()) {
      this.current.seek(this.current.duration() * percentage);
    }
  }

  updateProgress() {
    if (this.current && this.current.playing()) {
      const seek = this.current.seek() || 0;
      const duration = this.current.duration();
      console.log(`Progress: ${((seek / duration) * 100).toFixed(1)}%`);
      requestAnimationFrame(() => this.updateProgress());
    }
  }
}
```

--------------------------------

### Import Howler.js using ES6 Modules or CommonJS

Source: https://context7.com/goldfire/howler.js/llms.txt

Illustrates how to import the Howl and Howler classes from the Howler.js library using ES6 module syntax or CommonJS.

```javascript
import { Howl, Howler } from 'howler';
```

```javascript
const { Howl, Howler } = require('howler');
```

--------------------------------

### Import howler.js as Dependency

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Shows how to import the Howl and Howler modules using ES6 import syntax or CommonJS require.

```javascript
import {Howl, Howler} from 'howler';
```

```javascript
const {Howl, Howler} = require('howler');
```

--------------------------------

### Group Playback and Control (Howler.js)

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Demonstrates how to play multiple sound instances from a sprite, control their volume collectively, and pause them simultaneously using a single Howl instance.

```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3'],
  sprite: {
    track01: [0, 20000],
    track02: [21000, 41000]
  }
});

// Play each of the track.s
sound.play('track01');
sound.play('track02');

// Change the volume of both tracks.
sound.volume(0.5);

// After a second, pause both sounds in the group.
setTimeout(function() {
  sound.pause();
}, 1000);
```

--------------------------------

### stop() Method

Source: https://context7.com/goldfire/howler.js/llms.txt

Stops the playback of a sound and resets its seek position to the beginning.

```APIDOC
## stop()

Stops playback of a sound and resets its seek position to the beginning.

```javascript
const sound = new Howl({
  src: ['track.webm', 'track.mp3']
});

const id = sound.play();

// Stop a specific sound by ID
setTimeout(() => {
  sound.stop(id);
}, 5000);

// Stop all sounds in the group
sound.stop();
```
```

--------------------------------

### Encode WebM for Seekable Playback in Firefox using ffmpeg

Source: https://github.com/goldfire/howler.js/blob/master/README.md

This command-line instruction uses ffmpeg to encode WebM files with the 'dash' flag. This is necessary to ensure that WebM files are seekable in Firefox, providing a better user experience for seeking within audio or video content.

```bash
ffmpeg -i sound1.wav -dash 1 sound1.webm
```

--------------------------------

### Sound Sprites - Efficient Audio Management

Source: https://context7.com/goldfire/howler.js/llms.txt

Sound sprites allow multiple audio clips to be combined in a single file and played individually, improving loading performance.

```APIDOC
## Sound Sprites

### Description
Sound sprites allow multiple audio clips to be combined in a single file and played individually, which improves loading performance.

### Configuration
When initializing a Howl object, provide a `sprite` object:

`sprite: { spriteName: [startMs, durationMs, loop?] }`

- **spriteName**: A unique name for the audio clip.
- **startMs**: The starting position of the clip in milliseconds.
- **durationMs**: The duration of the clip in milliseconds.
- **loop** (Optional): A boolean value. If `true`, the sprite will loop.

### Request Example
```javascript
// Define a sprite with multiple sound clips
// Format: spriteName: [startMs, durationMs, loop?]
const gameAudio = new Howl({
  src: ['game-sprites.webm', 'game-sprites.mp3'],
  sprite: {
    // [start position in ms, duration in ms]
    shoot: [0, 300],
    explosion: [500, 1200],
    powerup: [2000, 800],
    music: [3000, 15000, true],  // Third param enables looping
    jump: [20000, 400],
    coinCollect: [21000, 250]
  }
});

// Play specific sprites
const shootId = gameAudio.play('shoot');
const explosionId = gameAudio.play('explosion');

// Multiple instances of the same sprite can play simultaneously
function rapidFire() {
  gameAudio.play('shoot');
}
setInterval(rapidFire, 100);

// Control individual sprite instances
const musicId = gameAudio.play('music');
gameAudio.volume(0.3, musicId);  // Lower background music volume

// Stop specific sprite while others continue
gameAudio.stop(musicId);

// Get duration of a sprite
gameAudio.once('load', function() {
  console.log('Explosion duration:', gameAudio.duration(explosionId));
});
```

### Response
#### Success Response (200)
Playing sprites returns the ID of the sound instance. Using `duration()` with a sprite ID returns the duration of that specific sprite.
```

--------------------------------

### Configure Sound Sprites

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Defines a sound sprite configuration object where keys map to [offset, duration, loop] arrays.

```javascript
new Howl({
  sprite: {
    key1: [offset, duration, (loop)]
  },
});
```

--------------------------------

### Handle Mobile Audio Restrictions with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Demonstrates how to manage mobile browser audio playback blocks by listening for unlock events and using user-triggered interactions. It also shows how to monitor audio context state changes for interruptions like incoming calls.

```javascript
const sound = new Howl({
  src: ['music.webm', 'music.mp3'],
  onplayerror: function(id, error) {
    console.log('Play blocked, waiting for user interaction...');
    sound.once('unlock', function() {
      console.log('Audio unlocked, resuming playback');
      sound.play();
    });
  }
});

document.getElementById('playButton').addEventListener('click', function() {
  sound.play();
});

Howler.autoUnlock = false;

if (Howler.ctx) {
  Howler.ctx.addEventListener('statechange', function() {
    if (Howler.ctx.state === 'interrupted') {
      console.log('Audio interrupted');
    } else if (Howler.ctx.state === 'running') {
      console.log('Audio resumed');
    }
  });
}
```

--------------------------------

### Streaming Audio Playback

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Configures a sound to stream using HTML5 Audio, which is recommended for large files or live audio streams.

```javascript
var sound = new Howl({
  src: ['stream.mp3'],
  html5: true
});

sound.play();
```

--------------------------------

### pause() Method

Source: https://context7.com/goldfire/howler.js/llms.txt

Pauses the playback of a sound, preserving the current seek position for later resumption.

```APIDOC
## pause()

Pauses playback of a sound, saving the current seek position for resuming later.

```javascript
const sound = new Howl({
  src: ['music.webm', 'music.mp3']
});

const id = sound.play();

// Pause a specific sound by ID
setTimeout(() => {
  sound.pause(id);
  console.log('Sound paused at:', sound.seek(id), 'seconds');
}, 3000);

// Pause all sounds in the group (omit ID)
sound.pause();
```
```

--------------------------------

### Configure Audio Looping with Howler.js

Source: https://context7.com/goldfire/howler.js/llms.txt

Shows how to enable or disable continuous looping for sounds or specific sound instances.

```javascript
const backgroundMusic = new Howl({
  src: ['ambient.webm', 'ambient.mp3'],
  loop: true
});

backgroundMusic.play();

// Disable looping
backgroundMusic.loop(false);

// Enable looping for a specific sound ID
const id = backgroundMusic.play();
backgroundMusic.loop(true, id);
```

--------------------------------

### Handle Howler.js Events

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Demonstrates how to attach event listeners to a Howl instance. It shows using 'once' for single-execution events and 'on' for recurring events like playback completion.

```javascript
var sound = new Howl({
  src: ['sound.webm', 'sound.mp3']
});

// Clear listener after first call.
sound.once('load', function(){
  sound.play();
});

// Fires when the sound finishes playing.
sound.on('end', function(){
  console.log('Finished!');
});
```

--------------------------------

### Global Options

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Configuration options that affect all Howler instances.

```APIDOC
### Global Options

#### usingWebAudio `Boolean`
`true` if the Web Audio API is available.

#### noAudio `Boolean`
`true` if no audio is available.

#### autoUnlock `Boolean` `true`
Automatically attempts to enable audio on mobile (iOS, Android, etc) devices and desktop Chrome/Safari.

#### html5PoolSize `Number` `10`
Each HTML5 Audio object must be unlocked individually, so we keep a global pool of unlocked nodes to share between all `Howl` instances. This pool gets created on the first user interaction and is set to the size of this property.

#### autoSuspend `Boolean` `true`
Automatically suspends the Web Audio AudioContext after 30 seconds of inactivity to decrease processing and energy usage. Automatically resumes upon new playback. Set this property to `false` to disable this behavior.

#### ctx `Boolean` *`Web Audio Only`*
Exposes the `AudioContext` with Web Audio API.

#### masterGain `Boolean` *`Web Audio Only`*
Exposes the master `GainNode` with Web Audio API. This can be useful for writing plugins or advanced usage.
```

--------------------------------

### Information Retrieval

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Methods for retrieving information about the audio playback.

```APIDOC
## GET /playing

### Description
Check if a sound is currently playing or not, returns a `Boolean`. If no sound ID is passed, check if any sound in the `Howl` group is playing.

### Method
GET

### Endpoint
/playing

### Parameters
#### Query Parameters
- **id** (Number) - Optional - The sound ID to check.

### Response
#### Success Response (200)
- **playing** (Boolean) - True if the sound is playing, false otherwise.

#### Response Example
```json
{
  "playing": true
}
```

## GET /duration

### Description
Get the duration of the audio source (in seconds). Will return 0 until after the `load` event fires.

### Method
GET

### Endpoint
/duration

### Parameters
#### Query Parameters
- **id** (Number) - Optional - The sound ID to check. Passing an ID will return the duration of the sprite being played on this instance; otherwise, the full source duration is returned.

### Response
#### Success Response (200)
- **duration** (Number) - The duration of the audio in seconds.

#### Response Example
```json
{
  "duration": 180.5
}
```
```

--------------------------------

### Spatial Audio Methods

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Methods for managing the 3D position, orientation, and panner attributes of audio sources.

```APIDOC
## pos(x, y, z, [id])

### Description
Get/set the 3D spatial position of the audio source relative to the global listener.

### Parameters
#### Path Parameters
- **x** (Number) - Required - The x-position of the audio source.
- **y** (Number) - Required - The y-position of the audio source.
- **z** (Number) - Required - The z-position of the audio source.
- **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.

## orientation(x, y, z, [id])

### Description
Get/set the direction the audio source is pointing in the 3D cartesian coordinate space.

### Parameters
- **x** (Number) - Required - The x-orientation of the source.
- **y** (Number) - Required - The y-orientation of the source.
- **z** (Number) - Required - The z-orientation of the source.
- **id** (Number) - Optional - The sound ID.

## pannerAttr(o, [id])

### Description
Get/set the panner node's attributes for a sound or group of sounds.

### Request Body
- **o** (Object) - Required - Object containing attributes: coneInnerAngle, coneOuterAngle, coneOuterGain, distanceModel, maxDistance, refDistance, rolloffFactor, panningModel.
```

--------------------------------

### Retrieve Audio Duration with duration()

Source: https://context7.com/goldfire/howler.js/llms.txt

Returns the total duration of an audio source or the specific duration of a sound sprite in seconds.

```javascript
const sound = new Howl({
  src: ['track.webm', 'track.mp3']
});

sound.once('load', function() {
  console.log('Total duration:', sound.duration(), 'seconds');
});

// With sprites, get sprite duration
const spriteSound = new Howl({
  src: ['effects.webm', 'effects.mp3'],
  sprite: {
    short: [0, 500],
    medium: [1000, 2000],
    long: [4000, 5000]
  }
});

spriteSound.once('load', function() {
  console.log('Full duration:', spriteSound.duration());

  const shortId = spriteSound.play('short');
  console.log('Short sprite duration:', spriteSound.duration(shortId));
});
```