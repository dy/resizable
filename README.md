# resizable

A tiny, dependency-free element resizer for the web. Modern ESM, Pointer Events,
keyboard controls, and nothing else to configure.

```sh
npm install resizable
```

```js
import Resizable from 'resizable'

const card = new Resizable(document.querySelector('.card'), {
  handles: ['e', 's', 'se'],
  within: 'parent'
})

card.on('resize', ({ detail }) => {
  console.log(detail.width, detail.height)
})
```

No stylesheet is required. Handles are unstyled, deliberately: target
`.resizable-handle` or a direction such as `.resizable-handle-se` to make them
visible. Their hit areas, cursors, touch behavior, and positioning work out of
the box.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `handles` | all eight | Directions as an array, comma-separated string, or `{ direction: element }` map. |
| `within` | `null` | Keep the element inside an element, or use `'parent'`. |
| `threshold` | `0` | Pointer movement in pixels before resizing starts. |
| `aspectRatio` | `false` | Preserve the initial ratio with `true`, or provide a numeric ratio. Holding Shift also preserves it. |
| `draggable` | `false` | Allow dragging from the element body. |
| `resize` | — | Convenience callback for the `resize` event. |

## Events

`resizestart`, `resize`, and `resizeend` are dispatched on both the instance and
the resized element. Element events bubble. Every event has a `detail` object:

```js
element.addEventListener('resizeend', ({ detail }) => {
  // { direction, width, height, left, top }
})
```

Handles are focusable separators. Use the arrow keys to resize by one pixel, or
hold Shift for ten pixels.

Call `destroy()` to remove generated handles and listeners. Supplied custom
handles remain in the DOM.

## Browser support

Resizable uses standard ES modules, Pointer Events, and `EventTarget`. It works
in current evergreen browsers and has no runtime dependencies.

## License

MIT
