# Resizable

Resizable behaviour for elements. [Demo](https://dfcreative.github.io/resizable).

**Note:** Elements in demo have been made [draggable](https://github.com/dfcreative/draggy).
This behavior is not included with __resizable__.

[![npm install resizable](https://nodei.co/npm/resizable.png?mini=true)](https://nodei.co/npm/resizable/)


```js
var Resizable = require('resizable');

var el = document.querySelector('.my-element');


var resizable = new Resizable(el, {
	within: 'parent',
	handles: 's, se, e',
	threshold: 10
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

\* Default handles are dependent on the styling of the given element. Inline
elements will default to `s`, `se`, `e`, while elements that can support full
resize will default to all handles being enabled.

## Events

| Name | Description |
|---|---|
| `resize` | Element resized. Called on self. |
