### Define full document root component

Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/static/prerender.md

Root component rendered by prerender must return the entire document including the root <html> tag.

```javascript
export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css"></link>
        <title>My app</title>
      </head>
      <body>
        <Router />
      </body>
    </html>
  );
}
```

--------------------------------

### Render entire document in React JSX

Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/client/hydrateRoot.md

Used when an application is fully built with React and includes root tags like html, head, and body in JSX.

```js
function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css"></link>
        <title>My app</title>
      </head>
      <body>
        <Router />
      </body>
    </html>
  );
}
```

### Hydrating an entire document

Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/client/hydrateRoot.md

Apps fully built with React can render the entire document as JSX, including the <html> tag. To hydrate the entire document, pass the document global as the first argument to hydrateRoot.

--------------------------------

### Rendering a React tree as HTML to a Readable Web Stream

Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/server/renderToReadableStream.md

Using renderToReadableStream renders a React tree as HTML into a Readable Web Stream. The root component should return the entire document including the root html tag, while React injects the doctype and bootstrap script tags into the resulting stream. On the client side, the bootstrap script hydrates the entire document using hydrateRoot to attach event listeners and enable interactivity.

--------------------------------

### Usage > Rendering a React tree to a stream of static HTML

Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/static/prerender.md

The prerender function renders a React component tree into a Readable Web Stream of static HTML. The root component must return the entire document, including the root <html> tag. React automatically injects the doctype and bootstrap script tags into the generated HTML stream. On the client, calling hydrateRoot attaches event listeners to the static server-rendered HTML to enable interactivity.
