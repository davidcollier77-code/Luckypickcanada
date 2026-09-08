### Install React Testing Library and DOM Utilities

Source: https://github.com/testing-library/react-testing-library/blob/main/README.md

Install the necessary packages for React Testing Library and its DOM utilities. This is required for RTL versions 16 and above.

```bash
npm install --save-dev @testing-library/react @testing-library/dom
```

```bash
yarn add --dev @testing-library/react @testing-library/dom
```

--------------------------------

### Basic Rendering with React Testing Library

Source: https://context7.com/testing-library/react-testing-library/llms.txt

Demonstrates basic rendering of a React component and usage of utility functions like `container`, `debug`, `rerender`, `asFragment`, and `unmount`. Also shows recommended usage of `screen` queries.

```jsx
import { render, screen, fireEvent } from '@testing-library/react'

// Basic rendering
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>
}

const { container, baseElement, debug, rerender, unmount, asFragment } = render(
  <Greeting name="World" />
)

// container: the div containing the rendered component
expect(container.firstChild).toHaveTextContent('Hello, World!')

// baseElement: defaults to document.body
expect(baseElement).toBe(document.body)

// debug: pretty prints the DOM for debugging
debug() // logs: <h1>Hello, World!</h1>

// rerender: update props without unmounting
rerender(<Greeting name="React" />)
expect(screen.getByText('Hello, React!')).toBeInTheDocument()

// asFragment: get a DocumentFragment of the rendered output (useful for snapshots)
expect(asFragment()).toMatchSnapshot()

// unmount: cleanup the component
unmount()
expect(container).toBeEmptyDOMElement()

// Using screen queries (recommended approach)
render(<Greeting name="Testing" />)
expect(screen.getByRole('heading')).toHaveTextContent('Hello, Testing!')
```

--------------------------------

### Customizing Render Options in React Testing Library

Source: https://context7.com/testing-library/react-testing-library/llms.txt

Shows how to use `render` with options for custom wrappers, containers, hydration, and React Strict Mode. Includes examples for `ThemeProvider` and server-side rendering hydration.

```jsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './theme-context'
import ReactDOMServer from 'react-dom/server'

// Custom wrapper for providers
function AllTheProviders({ children }) {
  return (
    <ThemeProvider theme="dark">
      {children}
    </ThemeProvider>
  )
}

function ThemedButton() {
  const theme = useTheme()
  return <button className={theme}>Click me</button>
}

// Render with wrapper
const { container } = render(<ThemedButton />, {
  wrapper: AllTheProviders,
})
expect(screen.getByRole('button')).toHaveClass('dark')

// Custom container (useful for special elements like tbody)
const tableContainer = document.createElement('table')
document.body.appendChild(tableContainer)

render(<tbody><tr><td>Cell</td></tr></tbody>, {
  container: tableContainer,
})

// Hydration for server-rendered content
function App() {
  const [count, setCount] = React.useState(0)
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
}

const hydrateContainer = document.createElement('div')
document.body.appendChild(hydrateContainer)
hydrateContainer.innerHTML = ReactDOMServer.renderToString(<App />)

render(<App />, {
  container: hydrateContainer,
  hydrate: true,
})

// React Strict Mode (renders components twice to detect side effects)
render(<MyComponent />, {
  reactStrictMode: true,
})
```

--------------------------------

### Configuring React Testing Library Globally

Source: https://context7.com/testing-library/react-testing-library/llms.txt

The configure function customizes global behavior, such as React Strict Mode and DOM Testing Library settings. Configurations can be set globally, modified with functions, or overridden per render.

```jsx
import { configure, getConfig, render, screen } from '@testing-library/react'

// Get current configuration
const currentConfig = getConfig()
console.log(currentConfig.reactStrictMode) // false (default)

// Configure globally with an object
configure({
  reactStrictMode: true,  // Wrap all renders in React.StrictMode
  testIdAttribute: 'data-my-test-id',  // Custom test ID attribute
})

// Configure with a function (receives current config, returns delta)
configure(existingConfig => ({
  reactStrictMode: !existingConfig.reactStrictMode,
}))

// Example: strict mode causes double renders
let renderCount = 0

function RenderCounter() {
  renderCount++
  return <div>Rendered {renderCount} times</div>
}

configure({ reactStrictMode: true })
render(<RenderCounter />)
// renderCount is 2 in strict mode (React renders twice to detect side effects)

// Override global config per render
configure({ reactStrictMode: false })
render(<RenderCounter />, { reactStrictMode: true }) // Still uses strict mode

// Reset configuration in tests
let originalConfig
beforeEach(() => {
  configure(existing => {
    originalConfig = existing
    return {}
  })
})
afterEach(() => {
  configure(originalConfig)
})
```

--------------------------------

### Runtime re-exports from @testing-library/dom

Source: https://github.com/testing-library/react-testing-library/blob/main/src/pure.js

src/pure.js re-exports everything from @testing-library/dom on line 360, which includes screen, waitFor, and all DTL queries. fireEvent is also imported locally (wrapper) and explicitly re-exported on line 361.

```javascript
// just re-export everything from dom-testing-library
export * from '@testing-library/dom'
export {render, renderHook, cleanup, act, fireEvent, getConfig, configure}
```
