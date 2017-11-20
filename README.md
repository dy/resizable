# Resizable

Resizable behaviour for elements. [Demo](https://dfcreative.github.io/resizable).

[![npm install resizable](https://nodei.co/npm/resizable.png?mini=true)](https://nodei.co/npm/resizable/)


```js
var Resizable = require('resizable');

var el = document.querySelector('.my-element');


var resizable = new Resizable(el, {
	within: 'parent',
	handles: 's, se, e',
	threshold: 10,
	draggable: false
});

resizable.on('resize', function(){
	//...
});
```

## Options

| Parameter | Default | Description |
|---|:---:|---|
| `handles` | * | List of handles to support. Valid handles: `s`, `se`, `e`, `ne`, `n`, `nw`, `w`, `sw`. May be specified as an object, array, or comma-separated string. |
| `resize` | `undefined` | Resize event handler. |
| `threshold` | `10` | A movement threshold required to start resize - whether array, number or function. |
| `within` | `document` | Restrict movement within the container. Pass `'parent'` to take parent node. |
| `draggable` | `false` | Make element [draggable](http://github.com/dfcreative/draggy) as well. Set an object to pass options to draggable. |
| `css3` | `true` | Use `translate3d` for defining position. |

\* Default handles are dependent on the styling of the given element. Inline
elements will default to `s`, `se`, `e`, while elements that can support full
resize will default to all handles being enabled.

## Events

| Name | Description |
|---|---|
| `resizestart` | Element resize started. Called on self. |
| `resize` | Element resized. Called on self. |
| `resizeend` | Element resize ended. Called on self. |