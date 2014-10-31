# Resizable

Makes any element resizable. Just as jQuery-UI resizable, but simplier and with no jQuery.


## Use

You have to use [browserify](https://github.com/substack/node-browserify), [component](https://github.com/componentjs/component), [duo](http://duojs.org/), [webmake](https://github.com/medikoo/modules-webmake) or any other browser `require` provider in order to use resizable.

`$ npm install resizable`


```
var Resizable = require('resizable');

//make an element draggable
var el = document.querySelector('.my-element');
var resizable = new Resizable(el, {
	//options
	release: true,
	sniper: false,
	axis: 'x'
});

resizable.on('resize', function(){
	//...
});
```


## Options

| Parameter | Default | Description |
|---|:---:|---|
| `within` | `undefined` | Restrict resizing within the container  |
| `handles` | `'e,w,n,s,nw,ne,sw,se'` | CSL/Array/Object of handles. Pass specific elements keyed by directions to make them handles.  |


## Events

| Name | Description |
|---|---|
| `dragstart` | Drag start |
| `drag` | Drag iteration |
| `release` | User released drag |
| `dragend` | Drag finished, called after release (stopped) |

