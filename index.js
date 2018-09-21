/**
 * @module  resizable
 */


var Draggable = require('draggy');
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
			within: self.within,
			css3: self.css3
		});
	} else if (self.draggable) {
		self.draggable = new Draggable(self.element, self.draggable);
		self.draggable.css3 = self.css3;
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


/** Use css3 for draggable, if any */
proto.css3 = true;


/** Make itself draggable to the row */
proto.draggable = false;



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

		//update draggalbe params
		self.draggable.update(e);

		//save initial dragging offsets
		var s = getComputedStyle(el);
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

		//save initial full size
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

		//trigger callbacks
		emit(self, 'resizestart');
		emit(el, 'resizestart');
	});

	draggy.on('drag', function () {
		var coords = draggy.getCoords();

		var prevSize = [
			el.offsetWidth,
			el.offsetHeight
		];

		//change width/height properly
		if (draggy.shiftKey) {
			switch (direction) {
				case 'se':
				case 's':
				case 'e':
					break;
				case 'nw':
					coords[0] = -coords[0];
					coords[1] = -coords[1];
					break;
				case 'n':
					coords[1] = -coords[1];
					break;
				case 'w':
					coords[0] = -coords[0];
					break;
				case 'ne':
					coords[1] = -coords[1];
					break;
				case 'sw':
					coords[0] = -coords[0];
					break;
			};

			//set placement is relative to initial center line
			css(el, {
				width: Math.min(
					self.initSize[0] + coords[0]*2,
					self.maxSize[2] + coords[0],
					self.maxSize[0] + coords[0]
				),
				height: Math.min(
					self.initSize[1] + coords[1]*2,
					self.maxSize[3] + coords[1],
					self.maxSize[1] + coords[1]
				)
			});

			var difX = prevSize[0] - el.offsetWidth;
			var difY = prevSize[1] - el.offsetHeight;

			//update draggable limits
			self.draggable.updateLimits();

			if (difX) {
				self.draggable.move(self.center[0] - self.initSize[0]/2 - coords[0]);
			}

			if (difY) {
				self.draggable.move(null, self.center[1] - self.initSize[1]/2 - coords[1]);
			}
		}
		else {
			switch (direction) {
				case 'se':
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

				case 's':
					css(el, {
						height: Math.min(
							self.initSize[1] + coords[1],
							self.maxSize[3]
						)
					});

				case 'e':
					css(el, {
						width: Math.min(
							self.initSize[0] + coords[0],
							self.maxSize[2]
						)
					});
				case 'se':
				case 's':
				case 'e':
					self.draggable.updateLimits();

					self.draggable.move(
						self.center[0] - self.initSize[0]/2,
						self.center[1] - self.initSize[1]/2
					);

					break;

				case 'nw':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});
				case 'n':
					css(el, {
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});
				case 'w':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0])
					});
				case 'nw':
				case 'n':
				case 'w':
					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaX = self.initSizeFull[0] - el.offsetWidth;
					var deltaY = self.initSizeFull[1] - el.offsetHeight;

					self.draggable.move(self.offsets[0] + deltaX, self.offsets[1] + deltaY);
					break;

				case 'ne':
					css(el, {
						width: between(self.initSize[0] + coords[0], 0, self.maxSize[2]),
						height: between(self.initSize[1] - coords[1], 0, self.maxSize[1])
					});

					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaY = self.initSizeFull[1] - el.offsetHeight;

					self.draggable.move(null, self.offsets[1] + deltaY);
					break;
				case 'sw':
					css(el, {
						width: between(self.initSize[0] - coords[0], 0, self.maxSize[0]),
						height: between(self.initSize[1] + coords[1], 0, self.maxSize[3])
					});

					self.draggable.updateLimits();

					//subtract t/l on changed size
					var deltaX = self.initSizeFull[0] - el.offsetWidth;

					self.draggable.move(self.offsets[0] + deltaX);
					break;
			};
		}

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

		//trigger callbacks
		emit(self, 'resizeend');
		emit(el, 'resizeend');
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
		Draggable.cache.get(this.handles[hName]).destroy();
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