### Timeline Methods Reference

Source: https://gsap.com/docs/v3/GSAP/Timeline

Documentation for core GSAP Timeline methods including duration, event callbacks, and tween creation.

```APIDOC
## duration(value: Number)

### Description
Gets the timeline's duration or, if used as a setter, adjusts the timeline's timeScale to fit it within the specified duration.

### Parameters
- **value** (Number) - Optional - The duration to set.

---

## endTime(includeRepeats: Boolean)

### Description
Returns the time at which the animation will finish according to the parent timeline's local time.

### Parameters
- **includeRepeats** (Boolean) - Required - Whether to include repeats in the calculation.

---

## eventCallback(type: String, callback: Function, params: Array)

### Description
Gets or sets an event callback like onComplete, onUpdate, onStart, onReverseComplete, or onRepeat along with any parameters that should be passed to that callback.

### Parameters
- **type** (String) - Required - The event type.
- **callback** (Function) - Required - The function to execute.
- **params** (Array) - Optional - Parameters for the callback.

---

## from(target: Object|Array|String, vars: Object, position: Number|String)

### Description
Adds a .from() tween to the end of the timeline (or elsewhere using the position parameter).

### Parameters
- **target** (Object|Array|String) - Required - The animation target.
- **vars** (Object) - Required - The tween properties.
- **position** (Number|String) - Optional - The position in the timeline.

---

## fromTo(target: Object|Array|String, fromVars: Object, toVars: Object, position: Number|String)

### Description
Adds a .fromTo() tween to the end of the timeline.

### Parameters
- **target** (Object|Array|String) - Required - The animation target.
- **fromVars** (Object) - Required - Starting properties.
- **toVars** (Object) - Required - Ending properties.
- **position** (Number|String) - Optional - The position in the timeline.

---

## getChildren(nested: Boolean, tweens: Boolean, timelines: Boolean, ignoreBeforeTime: Number)

### Description
Returns an array containing all the tweens and/or timelines nested in this timeline.

### Parameters
- **nested** (Boolean) - Required - Whether to include nested children.
- **tweens** (Boolean) - Required - Whether to include tweens.
- **timelines** (Boolean) - Required - Whether to include timelines.
- **ignoreBeforeTime** (Number) - Optional - Time threshold to ignore.
```

--------------------------------

### ScrollTrigger Configuration Options

Source: https://gsap.com/docs/v3/Plugins/ScrollTrigger

Details the available configuration options for ScrollTrigger.

```APIDOC
## ScrollTrigger Configuration Options

This document outlines the parameters available for configuring ScrollTrigger instances.

### animation[](#animation)

*   **Type**: `number`
*   **Description**: Controls the order in which ScrollTriggers are refreshed. A higher number indicates an earlier refresh. Defaults to `0`. Use this to manage dependencies between ScrollTriggers, especially when pinning affects subsequent triggers.

### scroller[](#scroller)

*   **Type**: `String | Element`
*   **Description**: Specifies the scrollable container. Defaults to the viewport. Can be a selector string (e.g., "#myDiv") or a direct DOM element reference.

### scrub[](#scrub)

*   **Type**: `Boolean | Number`
*   **Description**: Links the animation's progress to the scrollbar.
    *   `true`: Directly links progress.
    *   `Number`: Specifies a duration (in seconds) for the animation playhead to catch up, enabling smoothing. For example, `scrub: 0.5` creates a 0.5-second catch-up.

### snap[](#snap)

*   **Type**: `Number | Array | Function | Object | "labels" | "labelsDirectional"`
*   **Description**: Enables snapping to specific progress values after scrolling stops.
    *   **Number**: Snaps in defined increments (e.g., `snap: 0.1` for 10% increments).
    *   **Array**: Snaps to the closest value in the provided array (e.g., `snap: [0, 0.5, 1]`).
    *   **Function**: A callback function that receives the natural destination value and returns the snapped value. The returned value must be between 0 and 1.
    *   **"labels"**: Snaps to the closest label in a GSAP Timeline.
    *   **"labelsDirectional"**: Snaps to the closest label in the direction of the most recent scroll.
    *   **Object**: Allows for detailed configuration with properties like `snapTo` (required), `duration`, `delay`, and `ease`. Example: `{ snapTo: "labels", duration: 0.3, ease: "power1.inOut" }`.
```

--------------------------------

### SplitText Configuration Properties

Source: https://gsap.com/docs/v3/Plugins/SplitText

Details on the properties that can be passed to the SplitText configuration object.

```APIDOC
## SplitText Configuration Object

### Properties

#### `aria` (String)

- **Description**: Controls the addition of ARIA attributes for accessibility.
- **Options**: `"auto"` (default), `"hidden"`, `"none"`.
- **Default**: `"auto"`

#### `autoSplit` (Boolean)

- **Description**: Enables automatic re-splitting when fonts load or element width changes while splitting lines. Helps prevent odd line breaks.
- **Default**: `false`
- **Caution**: When `autoSplit: true`, animations should be created within an `onSplit()` callback.

```javascript
SplitText.create(".split", {
  type: "lines",
  autoSplit: true,
  onSplit: (self) => {
    return gsap.from(self.lines, {
      y: 100,
      opacity: 0,
      stagger: 0.05
    });
  }
});
```

#### `charsClass` (String)

- **Description**: A CSS class applied to each character's `<div>`. Can use `"++"` suffix for auto-incrementing classes (e.g., `"char++"` becomes `char char1`, `char char2`, etc.).
- **Default**: `undefined`

#### `deepSlice` (Boolean)

- **Description**: If `true`, nested elements that span multiple lines will be subdivided to prevent vertical expansion. Only effective for splitting `lines`.
- **Default**: `true`

#### `ignore` (String | Element | Array<Element>)

- **Description**: Descendant elements to ignore during splitting. These elements will remain but will not be split.
- **Default**: `undefined`

#### `linesClass` (String)

- **Description**: A CSS class applied to each line's `<div>`. Can use `"++"` suffix for auto-incrementing classes (e.g., `"line++"` becomes `line line1`, `line line2`, etc.).
- **Default**: `undefined`

#### `mask` ("lines" | "words" | "chars")

- **Description**: Wraps lines, words, or characters in an extra element with `visibility: clip` for easier reveal effects. Appends `"-mask"` to class names if provided. Only one mask type can be used.
- **Default**: `undefined`

#### `onRevert` (Function)

- **Description**: A callback function executed when the SplitText instance is reverted.

#### `onSplit` (Function)

- **Description**: A callback function executed after the SplitText instance has split the text.
```

--------------------------------

### Draggable Configuration Properties

Source: https://gsap.com/docs/v3/Plugins/Draggable

Configuration options for controlling inertia behavior and live snapping rules during drag interactions.

```APIDOC
## Draggable Configuration Properties

### Description
These properties define how an element behaves when released (inertia) and how it snaps to specific values while being dragged.

### Parameters
- **throwResistance** (Number) - Optional - Controls friction when inertia is enabled (default: 1000). Requires InertiaPlugin.
- **maxDuration** (Number) - Optional - Maximum duration in seconds for the inertia tween (default: 10s). Requires InertiaPlugin.
- **minDuration** (Number) - Optional - Minimum duration in seconds for the inertia tween (default: 0.2s). Requires InertiaPlugin.
- **overshootTolerance** (Number) - Optional - Amount of overshooting allowed before returning to resting position (default: 1).
- **liveSnap** (Function | Boolean | Array | Object) - Optional - Defines snapping rules applied while dragging.

### liveSnap Details
- **Function**: Receives current value, returns snapped value.
- **Array**: Snaps to the closest value in the provided array.
- **Object**: Allows property-specific snapping logic (e.g., {x: [...], y: [...]}) or point-based snapping.
- **Boolean**: If true, applies the 'snap' configuration live during drag.
```

--------------------------------

### MotionPathPlugin Static Methods

Source: https://gsap.com/docs/v3/Plugins/MotionPathPlugin

Documentation for static utility methods used for SVG path manipulation and coordinate calculations.

```APIDOC
## MotionPathPlugin.getRawPath

### Description
Gets the RawPath (Array) for the provided element or raw SVG path data.

### Parameters
#### Path Parameters
- **value** (String | Element) - Required - The element or raw SVG path data string.

### Response
- **RawPath** (Array) - An Array containing one Array for each contiguous segment with alternating x, y, x, y cubic bezier data.

## MotionPathPlugin.getRelativePosition

### Description
Gets the x and y distances between two elements regardless of nested transforms.

### Parameters
#### Path Parameters
- **fromElement** (Element | window) - Required - The source element.
- **toElement** (Element | window) - Required - The target element.
- **fromOrigin** (Array | Object) - Required - The origin point for the source.
- **toOrigin** (Array | Object | String) - Required - The origin point for the target.

### Response
- **Object** - Returns a point {x, y} representing the gap between elements.

## MotionPathPlugin.pointsToSegment

### Description
Plots a curved cubic bezier path through the provided x,y point coordinates.

### Parameters
#### Path Parameters
- **points** (Array) - Required - The x,y point coordinates.
- **curviness** (Number) - Required - The curviness factor.

### Response
- **Array** - A segment Array typically used in a RawPath Array.

## MotionPathPlugin.sliceRawPath

### Description
Slices the provided RawPath Array at the designated start/end positions.

### Parameters
#### Path Parameters
- **rawPath** (Array) - Required - The RawPath to slice.
- **start** (Number) - Required - Start position.
- **end** (Number) - Required - End position.

### Response
- **RawPath** - The resulting sliced RawPath.

## MotionPathPlugin.stringToRawPath

### Description
Converts a string path to a RawPath.

### Parameters
#### Path Parameters
- **data** (String) - Required - The path data string.

### Response
- **RawPath** - The converted RawPath.
```
