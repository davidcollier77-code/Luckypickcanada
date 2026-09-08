### Full viewport width

Source: https://tailwindcss.com/docs/width

Use w-screen to make an element span the entire width of the viewport.

```html
<div class="w-screen">  <!-- ... --></div>
```

--------------------------------

### Span full viewport inline size in HTML

Source: https://tailwindcss.com/docs/inline-size

Sets the element to match 100% of the viewport's inline size.

```html
<div class="inline-screen">  <!-- ... --></div>
```

--------------------------------

### Percentage-based width with fractions

Source: https://tailwindcss.com/docs/width

Use w-full or w-<fraction> utilities like w-1/2 and w-2/5 to set percentage-based widths.

```html
<div class="flex ...">  <div class="w-1/2 ...">w-1/2</div>  <div class="w-1/2 ...">w-1/2</div></div><div class="flex ...">  <div class="w-2/5 ...">w-2/5</div>  <div class="w-3/5 ...">w-3/5</div></div><div class="flex ...">  <div class="w-1/3 ...">w-1/3</div>  <div class="w-2/3 ...">w-2/3</div></div><div class="flex ...">  <div class="w-1/4 ...">w-1/4</div>  <div class="w-3/4 ...">w-3/4</div></div><div class="flex ...">  <div class="w-1/5 ...">w-1/5</div>  <div class="w-4/5 ...">w-4/5</div></div><div class="flex ...">  <div class="w-1/6 ...">w-1/6</div>  <div class="w-5/6 ...">w-5/6</div></div><div class="w-full ...">w-full</div>
```

--------------------------------

### Percentage-based max-block-size Utilities

Source: https://tailwindcss.com/docs/max-block-size

Employ `max-block-full` or `max-block-<fraction>` utilities for percentage-based maximum block sizes. Examples include `max-block-9/10`, `max-block-3/4`, `max-block-1/2`, and `max-block-full`.

```html
<div class="block-96 ...">  <div class="block-full max-block-9/10 ...">max-block-9/10</div>  <div class="block-full max-block-3/4 ...">max-block-3/4</div>  <div class="block-full max-block-1/2 ...">max-block-1/2</div>  <div class="block-full max-block-full ...">max-block-full</div></div>
```

### Examples > Matching viewport

Source: https://tailwindcss.com/docs/height

The `h-screen` utility is used to make an element occupy the full height of the viewport.
