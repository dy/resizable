var Draggable = require('../draggy');
var emit = require('emmy/emit');
var on = require('emmy/on');
var isArray = require('mutype/is-array');
var isString = require('mutype/is-string');
var isObject = require('mutype/is-object');
var extend = require('xtend/mutable');
var inherit = require('inherits');
var Emitter = require('events');
var between = require('mumath/clamp');
var splitKeys = require('split-keys');
var css = require('mucss/css');
var paddings = require('mucss/padding');
var borders = require('mucss/border');
var margins = require('mucss/margin');
var offsets = require('mucss/offset');
var parseCSSValue = require('mucss/parse-value');


var doc = document, win = window, root = doc.documentElement;


/**
 * Make an element resizable.
 *
 * Note that we don’t need a container option
 * as arbitrary container is emulatable via fake resizable.
 *
 * @constructor
 */
function Resizable (el, options) {
	var self = this;

	if (!(self instanceof Resizable)) {
		return new Resizable(el, options);
	}

	self.element = el;

	extend(self, options);

	//if element isn’t draggable yet - force it to be draggable, without movements
	if (self.draggable === true) {
		self.draggable = new Draggable(self.element, {
			within: self.within
		});
	} else if (self.draggable) {
		self.draggable = new Draggable(self.element, self.draggable);
	} else {
		self.draggable = new Draggable(self.element, {
			handle: null
		});
	}

	self.createHandles();

	//bind event, if any
	if (self.resize) {
		self.on('resize', self.resize);
	}
}

inherit(Resizable, Emitter);


var proto = Resizable.prototype;


/** Create handles according to options */
proto.createHandles = function () {
	var self = this;

	//init handles
	var handles;

	//parse value
	if (isArray(self.handles)) {
		handles = {};
		for (var i = self.handles.length; i--;){
			handles[self.handles[i]] = null;
		}
	}
	else if (isString(self.handles)) {
		handles = {};
		var arr = self.handles.match(/([swne]+)/g);
		for (var i = arr.length; i--;){
			handles[arr[i]] = null;
		}
	}
	else if (isObject(self.handles)) {
		handles = self.handles;
	}
	//default set of handles depends on position.
	else {
		var position = getComputedStyle(self.element).position;
		var display = getComputedStyle(self.element).display;
		//if display is inline-like - provide only three handles
		//it is position: static or display: inline
		if (/inline/.test(display) || /static/.test(position)){
			handles = {
				s: null,
				se: null,
				e: null
			};

			//ensure position is not static
			css(self.element, 'position', 'relative');
		}
		//else - all handles
		else {
			handles = {
				s: null,
				se: null,
				e: null,
				ne: null,
				n: null,
				nw: null,
				w: null,
				sw: null
			};
		}
	}

	//create proper number of handles
	var handle;
	for (var direction in handles) {
		handles[direction] = self.createHandle(handles[direction], direction);
	}

	//save handles elements
	self.handles = handles;
}


/** Create handle for the direction */
proto.createHandle = function(handle, direction){
	var self = this;

	var el = self.element;

	//make handle element
	if (!handle) {
		handle = document.createElement('div');
		handle.classList.add('resizable-handle');
	}

	//insert handle to the element
	self.element.appendChild(handle);

	//save direction
	handle.direction = direction;

	//detect self.within
	//FIXME: may be painful if resizable is created on detached element
	var within = self.within === 'parent' ? self.element.parentNode : self.within;

	//make handle draggable
	var draggy = new Draggable(handle, {
		within: within,
		//can’t use abs pos, as we engage it in styling
		// css3: false,
		threshold: self.threshold,
		axis: /^[ns]$/.test(direction) ? 'y' : /^[we]$/.test(direction) ? 'x' : 'both'
	});

	draggy.on('dragstart', function (e) {
		self.m = margins(el);
		self.b = borders(el);
		self.p = paddings(el);

		//parse initial offsets in dragging
		var s = getComputedStyle(el);
		// self.offsets = [parseCSSValue(s.left), parseCSSValue(s.top)];
		self.offsets = self.draggable.getCoords();

		//recalc border-box
		if (getComputedStyle(el).boxSizing === 'border-box') {
			self.p.top = 0;
			self.p.bottom = 0;
			self.p.left = 0;
			self.p.right = 0;
			self.b.top = 0;
			self.b.bottom = 0;
			self.b.left = 0;
			self.b.right = 0;
		}

		//save initial size
		self.initSize = [el.offsetWidth - self.b.left - self.b.right - self.p.left - self.p.right, el.offsetHeight - self.b.top - self.b.bottom - self.p.top - self.p.bottom];

		//get size
		self.initSizeFull = [
			el.offsetWidth,
			el.offsetHeight
		];

		//movement prev coords
		self.prevCoords = [0, 0];

		//shift-caused offset
		self.shiftOffset = [0, 0];

		//central initial coords
		self.center = [self.offsets[0] + self.initSize[0]/2, self.offsets[1] + self.initSize[1]/2];

		//calc limits (max height/width from left/right)
		if (self.within) {
			var po = offsets(within);
			var o = offsets(el);
			self.maxSize = [
				o.left - po.left + self.initSize[0],
				o.top - po.top + self.initSize[1],
				po.right - o.right + self.initSize[0],
				po.bottom - o.bottom + self.initSize[1]
			];
		} else {
			self.maxSize = [9999, 9999, 9999, 9999];
		}

		//preset mouse cursor
		css(root, {
			'cursor': direction + '-resize'
		});

		//clear cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', null);
		}

	});

	draggy.on('drag', function () {
		var coords = draggy.getCoords();

		//diff from the prev coords
		var diff = [
			coords[0] - self.prevCoords[0],
			coords[1] - self.prevCoords[1]
		];
		self.prevCoords = coords;

		//change width/height properly
		switch (direction) {
			case 'se':
			case 's':
			case 'e':
				if (draggy.shiftKey) {
					var prevSize = [
						el.offsetWidth,
						el.offsetHeight
					];


					//correct size & offset shift is pressed
					self.shiftOffset[0] += diff[0];
					self.shiftOffset[1] += diff[1];

					//we should limit shiftoffset to avoid clipping

					// self.offsets[0] += difX/2;
					// self.offsets[1] += difY/2;

					// self.maxSize[0] -= difX/2;
					// self.maxSize[1] -= difX/2;

					//shift placement is relative to initial center line
					css(el, {
						width: self.center[0] + (self.initSize[0])/2 + self.shiftOffset[0],
						height: self.center[1] + (self.initSize[1])/2 + self.shiftOffset[1]
					});

					var difX = prevSize[0] - el.offsetWidth;
					var difY = prevSize[1] - el.offsetHeight;

					//if no change of size - reset shiftOffset
					if (!difX) {
						self.shiftOffset[0] -= diff[0];
					} else {
						css(el, {
							left: self.center[0] - (self.initSize[0])/2 - self.shiftOffset[0]/2
						});
					}
					if (!difY) {
						self.shiftOffset[1] -= diff[1];
					} else {
						css(el, {
							top: self.center[1] - (self.initSize[1])/2 - self.shiftOffset[1]/2
						});
					}
				}
				else {
					css(el, {
						width: Math.min(
							self.initSize[0] + coords[0],
							self.maxSize[2]
						),
						height: Math.min(
							self.initSize[1] + coords[1],
							self.maxSize[3]
						)
					});
				}

				break;
			case 'nw':
			case 'n':
			case 'w':
				css(el, {
					width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
					height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
				});

				//subtract t/l on changed size
				var deltaX = self.initSizeFull[0] - el.offsetWidth;
				var deltaY = self.initSizeFull[1] - el.offsetHeight;

				self.draggable.setCoords(self.offsets[0] + deltaX, self.offsets[1] + deltaY);
				break;
			case 'ne':
				css(el, {
					width: between(self.initSize[0] + coords[0], 0, self.maxSize[2]),
					height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
				});

				//subtract t/l on changed size
				var deltaY = self.initSizeFull[1] - el.offsetHeight;

				self.draggable.setCoords(null, self.offsets[1] + deltaY);
				break;
			case 'sw':
				css(el, {
					width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
					height: between(self.initSize[1] + coords[1], 0, self.maxSize[3])
				});

				//subtract t/l on changed size
				var deltaX = self.initSizeFull[0] - el.offsetWidth;

				self.draggable.setCoords(self.offsets[0] + deltaX);
				break;
		};

		//trigger callbacks
		emit(self, 'resize');
		emit(el, 'resize');

		draggy.setCoords(0,0);
	});

	draggy.on('dragend', function(){
		//clear cursor & pointer-events
		css(root, {
			'cursor': null
		});

		//get back cursors
		for (var h in self.handles){
			css(self.handles[h], 'cursor', self.handles[h].direction + '-resize');
		}
	});

	//append styles
	css(handle, handleStyles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.classList.add('resizable-handle-' + direction);

	return handle;
};


/** deconstructor - removes any memory bindings */
proto.destroy = function () {
	//remove all handles
	for (var hName in this.handles){
		this.element.removeChild(this.handles[hName]);
		this.handles[hName].draggable.destroy();
	}


	//remove references
	this.element = null;
};


var w = 10;


/** Threshold size */
proto.threshold = w;


/** Styles for handles */
var handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se': {
		'position': 'absolute'
	},
	'e,w': {
		'top, bottom':0,
		'width': w
	},
	'e': {
		'left': 'auto',
		'right': -w/2
	},
	'w': {
		'right': 'auto',
		'left': -w/2
	},
	's': {
		'top': 'auto',
		'bottom': -w/2
	},
	'n': {
		'bottom': 'auto',
		'top': -w/2
	},
	'n,s': {
		'left, right': 0,
		'height': w
	},
	'nw,ne,sw,se': {
		'width': w,
		'height': w,
		'z-index': 1
	},
	'nw': {
		'top, left': -w/2,
		'bottom, right': 'auto'
	},
	'ne': {
		'top, right': -w/2,
		'bottom, left': 'auto'
	},
	'sw': {
		'bottom, left': -w/2,
		'top, right': 'auto'
	},
	'se': {
		'bottom, right': -w/2,
		'top, left': 'auto'
	}
}, true);



/**
 * @module resizable
 */
module.exports = Resizable;