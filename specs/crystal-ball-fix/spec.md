# Crystal Ball Text Reveal Polish

Improve the Crystal Ball fortune reveal so words remain intact while wrapping, Unicode characters render safely, explicit newline characters produce visible line breaks, and timing/scroll behavior stays consistent with the user's motion preference.

## User-visible outcomes

- Words do not split across lines because each character is rendered in separate spans.
- Supplementary Unicode characters are iterated as code points rather than split into UTF-16 surrogate halves.
- Newline characters create line breaks instead of disappearing inside non-wrapping inline groups.
- The reveal respects reduced-motion changes and retains the established reveal order, audio synchronization, and leaf flight.
- The scene scrolls into view from the top rather than centering and cropping the artwork.
