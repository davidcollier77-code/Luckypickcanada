### Play an MP3 with howler.js

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Creates a Howl instance for a single MP3 file and plays it. This is the most basic usage example.

```javascript
var sound = new Howl({
  src: ['sound.mp3']
});

sound.play();
```

--------------------------------

### Configure XHR options for Web Audio loading

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Configures the XHR request used by Web Audio to load audio files. Supports custom headers, HTTP method, and withCredentials. Method defaults to GET, headers to null, and withCredentials to false.

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

### Listen for load and end events

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Listens for the 'load' event once to start playback, and the 'end' event to log when the sound finishes. The once() listener is automatically removed after the first call.

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

### ES6 usage with global volume control

Source: https://github.com/goldfire/howler.js/blob/master/README.md

ES6 example that imports Howl and Howler, creates a Howl instance, plays it, and changes the global volume via Howler.volume().

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

### duration([id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get the duration of the audio source (in seconds). Will return 0 until after the `load` event fires.

```APIDOC
## duration([id])

### Description
Get the duration of the audio source (in seconds). Will return 0 until after the `load` event fires.

### Parameters
- **id** (`Number`) - Optional - The sound ID to check. Passing an ID will return the duration of the sprite being played on this instance; otherwise, the full source duration is returned.

### Returns
- Number - Duration in seconds.
```

--------------------------------

### Howler.volume([volume])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Gets or sets the global volume for all sounds, relative to their own volume. If no argument is provided, returns the current global volume.

```APIDOC
## Howler.volume([volume])

### Description
Get/set the global volume for all sounds, relative to their own volume.

### Method
volume

### Parameters
- **volume** (Number) - Optional - Volume from `0.0` to `1.0`.

### Response
Returns the current global volume if no argument is provided.
```

--------------------------------

### Set up test navigation buttons

Source: https://github.com/goldfire/howler.js/blob/master/tests/index.html

Assigns click handlers to the three test buttons, navigating to the corresponding test page when clicked.

```javascript
document.getElementById('webaudio').onclick = function() { window.location = 'core.webaudio.html'; };
```

```javascript
document.getElementById('html5').onclick = function() { window.location = 'core.html5audio.html'; };
```

```javascript
document.getElementById('spatial').onclick = function() { window.location = 'spatial.html'; };
```

--------------------------------

### load()

Source: https://github.com/goldfire/howler.js/blob/master/README.md

This is called by default, but if you set `preload` to false, you must call `load` before you can play any sounds.

```APIDOC
## load()

### Description
This is called by default, but if you set `preload` to false, you must call `load` before you can play any sounds.
```

--------------------------------

### on(event, function, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Listen for events. Multiple events can be added by calling this multiple times.

```APIDOC
## on(event, function, [id])

### Description
Listen for events. Multiple events can be added by calling this multiple times.

### Parameters
- **event** (`String`) - Required - Name of event to fire/set (`load`, `loaderror`, `playerror`, `play`, `end`, `pause`, `stop`, `mute`, `volume`, `rate`, `seek`, `fade`, `unlock`).
- **function** (`Function`) - Required - Define function to fire on event.
- **id** (`Number`) - Optional - Only listen to events for this sound id.
```

--------------------------------

### Stream audio with html5: true

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Enables HTML5 Audio streaming by setting html5: true. Use this for live audio or large files that should not be fully loaded into memory.

```javascript
var sound = new Howl({
  src: ['stream.mp3'],
  html5: true
});

sound.play();
```

--------------------------------

### Load howler.js in the browser and create a Howl instance

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Loads howler.js via a script tag and creates a new Howl instance with a source array of audio files. The browser will automatically choose the first supported format.

```html
<script src="/path/to/howler.js"></script>
<script>
    var sound = new Howl({
      src: ['sound.webm', 'sound.mp3']
    });
</script>
```

--------------------------------

### play([sprite/id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Begins playback of a sound. Returns the sound id to be used with other methods. Only method that can't be chained.

```APIDOC
## play([sprite/id])

### Description
Begins playback of a sound. Returns the sound id to be used with other methods. Only method that can't be chained.

### Parameters
- **sprite/id** (`String/Number`) - Optional - Can be a sprite or sound ID. If a sprite is passed, a new sound will play based on the sprite's definition. If a sound ID is passed, the previously played sound will be played (for example, after pausing it). However, if an ID of a sound that has been drained from the pool is passed, nothing will play.

### Returns
- Sound ID (Number) - The sound id to be used with other methods.
```

--------------------------------

### orientation(x, y, z, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the direction the audio source is pointing in the 3D cartesian coordinate space.

```APIDOC
## orientation(x, y, z, [id])

### Description
Get/set the direction the audio source is pointing in the 3D cartesian coordinate space. Depending on how directional the sound is, based on the `cone` attributes, a sound pointing away from the listener can be quiet or silent.

### Parameters
- **x** (Number) - Required - The x-orientation of the source.
- **y** (Number) - Required - The y-orientation of the source.
- **z** (Number) - Required - The z-orientation of the source.
- **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.

```

--------------------------------

### Howl Options

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Configuration options for creating a Howl instance, including audio sources, volume, playback settings, and XHR settings.

```APIDOC
## Howl Options

### Description
Options for configuring a Howl instance in howler.js.

### Constructor
`new Howl(options)`

### Options
- **src** (Array|String) - Required - The sources to the track(s) to be loaded for the sound (URLs or base64 data URIs). These should be in order of preference, howler.js will automatically load the first one that is compatible with the current browser. If your files have no extensions, you will need to explicitly specify the extension using the `format` property.
- **volume** (Number) - Optional - The volume of the specific track, from `0.0` to `1.0`. Default: `1.0`.
- **html5** (Boolean) - Optional - Set to `true` to force HTML5 Audio. This should be used for large audio files so that you don't have to wait for the full file to be downloaded and decoded before playing. Default: `false`.
- **loop** (Boolean) - Optional - Set to `true` to automatically loop the sound forever. Default: `false`.
- **preload** (Boolean|String) - Optional - Automatically begin downloading the audio file when the `Howl` is defined. If using HTML5 Audio, you can set this to `'metadata'` to only preload the file's metadata (to get its duration without download the entire file, for example). Default: `true`.
- **autoplay** (Boolean) - Optional - Set to `true` to automatically start playback when sound is loaded. Default: `false`.
- **mute** (Boolean) - Optional - Set to `true` to load the audio muted. Default: `false`.
- **sprite** (Object) - Optional - Define a sound sprite for the sound. The offset and duration are defined in milliseconds. A third (optional) parameter is available to set a sprite as looping. An easy way to generate compatible sound sprites is with [audiosprite](https://github.com/tonistiigi/audiosprite). Default: `{}`.
- **rate** (Number) - Optional - The rate of playback. 0.5 to 4.0, with 1.0 being normal speed. Default: `1.0`.
- **pool** (Number) - Optional - The size of the inactive sounds pool. Once sounds are stopped or finish playing, they are marked as ended and ready for cleanup. We keep a pool of these to recycle for improved performance. Generally this doesn't need to be changed. It is important to keep in mind that when a sound is paused, it won't be removed from the pool and will still be considered active so that it can be resumed later. Default: `5`.
- **format** (Array) - Optional - howler.js automatically detects your file format from the extension, but you may also specify a format in situations where extraction won't work (such as with a SoundCloud stream). Default: `[]`.
- **xhr** (Object) - Optional - When using Web Audio, howler.js uses an XHR request to load the audio files. If you need to send custom headers, set the HTTP method or enable `withCredentials` ([see reference](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials)), include them with this parameter. Each is optional (method defaults to `GET`, headers default to `null` and withCredentials defaults to `false`). Default: `null`.

### Example
javascript
new Howl({
  src: ['audio.mp3'],
  volume: 0.8,
  html5: true,
  loop: true,
  preload: true,
  autoplay: false,
  mute: false,
  sprite: {
    key1: [0, 2000],
    key2: [2000, 3000, true]
  },
  rate: 1.0,
  pool: 5,
  format: ['mp3'],
  xhr: {
    method: 'POST',
    headers: {
      Authorization: 'Bearer: token'
    },
    withCredentials: true
  }
});


```

--------------------------------

### rate([rate], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the rate of playback for a sound. This method optionally takes 0, 1 or 2 arguments.

```APIDOC
## rate([rate], [id])

### Description
Get/set the rate of playback for a sound. This method optionally takes 0, 1 or 2 arguments.

### Parameters
- **rate** (`Number`) - Optional - The rate of playback. 0.5 to 4.0, with 1.0 being normal speed.
- **id** (`Number`) - Optional - The sound ID. If none is passed, playback rate of all sounds in group will change.
```

--------------------------------

### Configure playback options: autoplay, loop, volume, onend

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Configures a Howl instance with autoplay, looping, volume, and an onend callback. The onend callback fires when the sound finishes playing.

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

### seek([seek], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the position of playback for a sound. This method optionally takes 0, 1 or 2 arguments.

```APIDOC
## seek([seek], [id])

### Description
Get/set the position of playback for a sound. This method optionally takes 0, 1 or 2 arguments.

### Parameters
- **seek** (`Number`) - Optional - The position to move current playback to (in seconds).
- **id** (`Number`) - Optional - The sound ID. If none is passed, the first sound will seek.
```

--------------------------------

### Group playback with Howl sprite tracks

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Shows how to use a single Howl instance as a group to play multiple sprite tracks, adjust their volume together, and pause them all after a delay. Each Howl can contain only one audio file, but multiple instances can be played from its sprite.

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

### once(event, function, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Same as `on`, but it removes itself after the callback is fired.

```APIDOC
## once(event, function, [id])

### Description
Same as `on`, but it removes itself after the callback is fired.

### Parameters
- **event** (`String`) - Required - Name of event to fire/set (`load`, `loaderror`, `playerror`, `play`, `end`, `pause`, `stop`, `mute`, `volume`, `rate`, `seek`, `fade`, `unlock`).
- **function** (`Function`) - Required - Define function to fire on event.
- **id** (`Number`) - Optional - Only listen to events for this sound id.
```

--------------------------------

### stereo(pan, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the stereo panning of the audio source for this sound or all in the group.

```APIDOC
## stereo(pan, [id])

### Description
Get/set the stereo panning of the audio source for this sound or all in the group.

### Parameters
- **pan** (Number) - Required - A value of `-1.0` is all the way left and `1.0` is all the way right.
- **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.

```

--------------------------------

### state()

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Check the load status of the `Howl`, returns a `unloaded`, `loading` or `loaded`.

```APIDOC
## state()

### Description
Check the load status of the `Howl`, returns a `unloaded`, `loading` or `loaded`.

### Returns
- String - One of `unloaded`, `loading`, or `loaded`.
```

--------------------------------

### loop([loop], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set whether to loop the sound or group. This method can optionally take 0, 1 or 2 arguments.

```APIDOC
## loop([loop], [id])

### Description
Get/set whether to loop the sound or group. This method can optionally take 0, 1 or 2 arguments.

### Parameters
- **loop** (`Boolean`) - Optional - To loop or not to loop, that is the question.
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group will have their `loop` property updated.
```

--------------------------------

### fade(from, to, duration, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Fade a currently playing sound between two volumes. Fires the `fade` event when complete.

```APIDOC
## fade(from, to, duration, [id])

### Description
Fade a currently playing sound between two volumes. Fires the `fade` event when complete.

### Parameters
- **from** (`Number`) - Required - Volume to fade from (`0.0` to `1.0`).
- **to** (`Number`) - Required - Volume to fade to (`0.0` to `1.0`).
- **duration** (`Number`) - Required - Time in milliseconds to fade.
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group will fade.
```

--------------------------------

### volume([volume], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set volume of this sound or the group. This method optionally takes 0, 1 or 2 arguments.

```APIDOC
## volume([volume], [id])

### Description
Get/set volume of this sound or the group. This method optionally takes 0, 1 or 2 arguments.

### Parameters
- **volume** (`Number`) - Optional - Volume from `0.0` to `1.0`.
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group have volume altered relative to their own volume.
```

--------------------------------

### Howler.codecs(ext)

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Checks if a given audio codec is supported in the current browser. Returns true if supported, false otherwise.

```APIDOC
## Howler.codecs(ext)

### Description
Check supported audio codecs. Returns `true` if the codec is supported in the current browser.

### Method
codecs

### Parameters
- **ext** (String) - Required - File extension. One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav", "aac", "caf", "m4a", "m4b", "mp4", "weba", "webm", "dolby", "flac".

### Response
Returns `true` if the codec is supported, otherwise `false`.
```

--------------------------------

### Play Dolby Audio with howler.js

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Loads a Dolby Audio file by specifying the format as 'dolby' because it is in an mp4 container. Supported in Edge and Safari.

```javascript
var dolbySound = new Howl({
  src: ['sound.mp4', 'sound.webm', 'sound.mp3'],
  format: ['dolby', 'webm', 'mp3']
});
```

--------------------------------

### Define a sound sprite with the sprite option

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Defines a sound sprite with offset and duration in milliseconds. An optional third parameter sets the sprite to loop. Use with the audiosprite tool to generate compatible sprites.

```javascript
new Howl({
  sprite: {
    key1: [offset, duration, (loop)]
  },
});
```

--------------------------------

### Control multiple sounds with Sound IDs

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Plays the same sound multiple times, each returning a unique Sound ID. These IDs are used to control individual sounds, e.g., fading out one and changing the rate of another.

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

### Define and play a sound sprite

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Defines a sound sprite with named segments (blast, laser, winner) and plays a specific sprite by passing its name to play().

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

--------------------------------

### pos(x, y, z, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.

```APIDOC
## pos(x, y, z, [id])

### Description
Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.

### Parameters
- **x** (Number) - Required - The x-position of the audio source.
- **y** (Number) - Required - The y-position of the audio source.
- **z** (Number) - Required - The z-position of the audio source.
- **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.

```

--------------------------------

### Encode seekable webm with ffmpeg dash flag

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Encodes a webm file with the cues element using the dash flag in ffmpeg, which makes the file seekable in Firefox.

```bash
ffmpeg -i sound1.wav -dash 1 sound1.webm
```

--------------------------------

### stop([id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Stops playback of sound, resetting `seek` to `0`.

```APIDOC
## stop([id])

### Description
Stops playback of sound, resetting `seek` to `0`.

### Parameters
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group are stopped.
```

--------------------------------

### pause([id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Pauses playback of sound or group, saving the `seek` of playback.

```APIDOC
## pause([id])

### Description
Pauses playback of sound or group, saving the `seek` of playback.

### Parameters
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group are paused.
```

--------------------------------

### Howl Events

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Event callbacks that can be provided in the Howl options to handle various audio lifecycle events.

```APIDOC
## Howl Events

### Description
Event callbacks that fire during the audio lifecycle. These are passed as options to the Howl constructor.

### Events
- **onload** (Function) - Fires when the sound is loaded.
- **onloaderror** (Function) - Fires when the sound is unable to load. The first parameter is the ID of the sound (if it exists) and the second is the error message/code. The load error codes are [defined in the spec](http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror):
  - **1** - The fetching process for the media resource was aborted by the user agent at the user's request.
  - **2** - A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.
  - **3** - An error of some description occurred while decoding the media resource, after the resource was established to be usable.
  - **4** - The media resource indicated by the src attribute or assigned media provider object was not suitable.
- **onplayerror** (Function) - Fires when the sound is unable to play. The first parameter is the ID of the sound and the second is the error message/code.
- **onplay** (Function) - Fires when the sound begins playing. The first parameter is the ID of the sound.
- **onend** (Function) - Fires when the sound finishes playing (if it is looping, it'll fire at the end of each loop). The first parameter is the ID of the sound.
- **onpause** (Function) - Fires when the sound has been paused. The first parameter is the ID of the sound.
- **onstop** (Function) - Fires when the sound has been stopped. The first parameter is the ID of the sound.
- **onmute** (Function) - Fires when the sound has been muted/unmuted. The first parameter is the ID of the sound.
- **onvolume** (Function) - Fires when the sound's volume has changed. The first parameter is the ID of the sound.
- **onrate** (Function) - Fires when the sound's playback rate has changed. The first parameter is the ID of the sound.
- **onseek** (Function) - Fires when the sound has been seeked. The first parameter is the ID of the sound.

### Example
javascript
new Howl({
  src: ['audio.mp3'],
  onload: function() { console.log('loaded'); },
  onloaderror: function(id, err) { console.error('load error', id, err); },
  onplayerror: function(id, err) { console.error('play error', id, err); },
  onplay: function(id) { console.log('playing', id); },
  onend: function(id) { console.log('ended', id); },
  onpause: function(id) { console.log('paused', id); },
  onstop: function(id) { console.log('stopped', id); },
  onmute: function(id) { console.log('muted', id); },
  onvolume: function(id) { console.log('volume changed', id); },
  onrate: function(id) { console.log('rate changed', id); },
  onseek: function(id) { console.log('seeked', id); }
});


```

--------------------------------

### playing([id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Check if a sound is currently playing or not, returns a `Boolean`. If no sound ID is passed, check if any sound in the `Howl` group is playing.

```APIDOC
## playing([id])

### Description
Check if a sound is currently playing or not, returns a `Boolean`. If no sound ID is passed, check if any sound in the `Howl` group is playing.

### Parameters
- **id** (`Number`) - Optional - The sound ID to check.

### Returns
- Boolean - Whether the sound is playing.
```

--------------------------------

### mute([muted], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Mutes the sound, but doesn't pause the playback.

```APIDOC
## mute([muted], [id])

### Description
Mutes the sound, but doesn't pause the playback.

### Parameters
- **muted** (`Boolean`) - Optional - True to mute and false to unmute.
- **id** (`Number`) - Optional - The sound ID. If none is passed, all sounds in group are stopped.
```

--------------------------------

### Require howler.js with CommonJS

Source: https://github.com/goldfire/howler.js/blob/master/README.md

CommonJS require for howler.js. Use this in Node.js environments or with bundlers that support CommonJS.

```javascript
const {Howl, Howler} = require('howler');
```

--------------------------------

### Retry playback after unlock event

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Handles automatic playback on page load by listening for the playerror event and retrying after the unlock event fires. This is useful when audio is locked until a user interaction.

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

### Import howler.js as an ES module

Source: https://github.com/goldfire/howler.js/blob/master/README.md

ES module import for howler.js. Use this when your project uses ES6 modules or a bundler that supports them.

```javascript
import {Howl, Howler} from 'howler';
```

--------------------------------

### Howler.stop()

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Stops all sounds and resets their seek position to the beginning.

```APIDOC
## Howler.stop()

### Description
Stop all sounds and reset their seek position to the beginning.

### Method
stop

### Parameters
None.

### Response
No return value.
```

--------------------------------

### off(event, [function], [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Remove event listener that you've set. Call without parameters to remove all events.

```APIDOC
## off(event, [function], [id])

### Description
Remove event listener that you've set. Call without parameters to remove all events.

### Parameters
- **event** (`String`) - Required - Name of event (`load`, `loaderror`, `playerror`, `play`, `end`, `pause`, `stop`, `mute`, `volume`, `rate`, `seek`, `fade`, `unlock`).
- **function** (`Function`) - Optional - The listener to remove. Omit this to remove all events of type.
- **id** (`Number`) - Optional - Only remove events for this sound id.
```

--------------------------------

### unload()

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Unload and destroy a Howl object. This will immediately stop all sounds attached to this sound and remove it from the cache.

```APIDOC
## unload()

### Description
Unload and destroy a Howl object. This will immediately stop all sounds attached to this sound and remove it from the cache.
```

--------------------------------

### pannerAttr(o, [id])

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Get/set the panner node's attributes for a sound or group of sounds.

```APIDOC
## pannerAttr(o, [id])

### Description
Get/set the panner node's attributes for a sound or group of sounds.

### Parameters
- **o** (Object) - Required - All values to update.
  - **coneInnerAngle** (Number) - Optional - A parameter for directional audio sources, this is an angle, in degrees, inside of which there will be no volume reduction. Default: `360`.
  - **coneOuterAngle** (Number) - Optional - A parameter for directional audio sources, this is an angle, in degrees, outside of which the volume will be reduced to a constant value of `coneOuterGain`. Default: `360`.
  - **coneOuterGain** (Number) - Optional - A parameter for directional audio sources, this is the gain outside of the `coneOuterAngle`. It is a linear value in the range `[0, 1]`. Default: `0`.
  - **distanceModel** (String) - Optional - Determines algorithm used to reduce volume as audio moves away from listener. Can be `linear`, `inverse` or `exponential`. Default: `inverse`.
  - **maxDistance** (Number) - Optional - The maximum distance between source and listener, after which the volume will not be reduced any further. Default: `10000`.
  - **refDistance** (Number) - Optional - A reference distance for reducing volume as source moves further from the listener. Default: `1`.
  - **rolloffFactor** (Number) - Optional - How quickly the volume reduces as source moves from listener. Default: `1`.
  - **panningModel** (String) - Optional - Determines which spatialization algorithm is used to position audio. Can be `HRTF` or `equalpower`. Default: `HRTF`.
- **id** (Number) - Optional - The sound ID. If none is passed, all in group will be updated.

```

--------------------------------

### Howler.mute(muted)

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Mutes or unmutes all sounds globally. Pass true to mute and false to unmute.

```APIDOC
## Howler.mute(muted)

### Description
Mute or unmute all sounds globally.

### Method
mute

### Parameters
- **muted** (Boolean) - Required - True to mute and false to unmute.

### Response
No return value.
```

--------------------------------

### Howler.unload()

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Unloads and destroys all currently loaded Howl objects, immediately stopping all sounds and removing them from cache.

```APIDOC
## Howler.unload()

### Description
Unload and destroy all currently loaded Howl objects. This will immediately stop all sounds and remove them from cache.

### Method
unload

### Parameters
None.

### Response
No return value.
```

--------------------------------

### Disable autoUnlock in howler.js

Source: https://github.com/goldfire/howler.js/blob/master/README.md

Disables howler.js's default silent audio unlock on the first touchend event. Use this when you want to control the unlock behavior manually on mobile browsers and Chrome/Safari.

```javascript
Howler.autoUnlock = false;
```

=== COMPLETE CONTENT === This response contains all available snippets from this library. No additional content exists. Do not make further requests.