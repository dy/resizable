# Resizable

Make any element resizable. Just as jQuery-UI, but simpler and without jQuery.


## Use

You have to use [browserify](https://github.com/substack/node-browserify), [component](https://github.com/componentjs/component), [duo](http://duojs.org/), [webmake](https://github.com/medikoo/modules-webmake) or any other browser `require` provider in order to use resizable.

`$ npm install resizable`


```js
var Resizable = require('resizable');

var el = document.querySelector('.my-element');

//make an element resizable
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
| `within` | `parentNode` or `root` | Restrict resizing within the container  |
| `handles` | `'e,w,n,s,nw,ne,sw,se'` or `'s,se,e'` | CSV/Array/Object of handles.  |


## Events

| Name | Description |
|---|---|
| `resize` | When element actual size has changed |

