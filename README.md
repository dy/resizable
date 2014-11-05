# Resizable

Makes any element resizable. Just as jQuery-UI resizable, but simplier and with no jQuery.


## Use

You have to use [browserify](https://github.com/substack/node-browserify), [component](https://github.com/componentjs/component), [duo](http://duojs.org/), [webmake](https://github.com/medikoo/modules-webmake) or any other browser `require` provider in order to use resizable.

`$ npm install resizable`


```js
var Resizable = require('resizable');

//make an element draggable
var el = document.querySelector('.my-element');

var resizable = new Resizable(el, {
	//options
});

resizable.on('resize', function(){
	//...
});
```


## Options

| Parameter | Default | Description |
|---|:---:|---|
| `within` | `this.parentNode` | Restrict resizing within the container  |
| `handles` | `'e,w,n,s,nw,ne,sw,se'` | CSV/Array/Object of handles.  |


## Events

| Name | Description |
|---|---|
| `resize` | When element actual size has changed |

