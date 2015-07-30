Resizable behaviour provider. [Tests](https://dfcreative.github.io/resizable).

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