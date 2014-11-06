var css = require('mucss');
var Draggable = require('draggy');
var state = require('st8');
var Enot = require('enot');
var splitKeys = require('split-keys');
var parse = require('muparse');
var type = require('mutypes');
var softExtend = require('soft-extend');
var qel = require('tiny-element');


//FIXME: test whether it is not very slow to change root’s style
//FIXME: think up a better way of hiding the cursor, not the disabling the pointer events (it causes :hover classes turn off)

/** Shortcuts */
var doc = document, win = window, root = doc.documentElement;


/**
 * Resizable class
 *
 * @constructor
 */
function Resizable(el, options){
	var constr = this.constructor;

	//bind controller
	this.element = el;
	this.element.resizable = this;

	//ensure options
	options = options || {};

	//read attributes on targret, extend options
	var prop, parseResult;
	for (var propName in constr.options){
		//parse attribute, if no option passed
		if (options[propName] === undefined){
			prop = constr.options[propName];
			options[propName] = parse.attribute(el, propName, prop && prop.init !== undefined ? prop.init : prop);
		}

		//declare initial value
		if (options[propName] !== undefined) {
			this[propName] = options[propName];
		}
	}

	//apply params
	state(this, constr.options);
}


/**
 * Defaults
 */
Resizable.options = {
	/** restrict resizing within the container */
	within: {
		init: function(val){
			var res;
			//defaultly restrictor is parent container
			if (val === undefined) {
				res = this.element.parentNode;
			}
			//unless null is separately stated
			else if (val !== null) {
				res = qel(val);
			}

			return res;
		}
	},

	/**
	 * list/array/object of direction-keyed handles
	 * @enum {string}
	 */
	handles: {
		init: function(val){
			//set of handles
			var handles, style = getComputedStyle(this.element);

			//parse value
			if (type.isArray(val)){
				handles = {};
				for (var i = val.length; i--;){
					handles[val[i]] = null;
				}
			}
			else if (type.isString(val)){
				handles = {};
				var arr = val.split(/\s?,\s?/);
				for (var i = arr.length; i--;){
					handles[arr[i]] = null;
				}
			}
			else if (type.isObject(val)) {
				handles = val;
			}
			//default set of handles depends on position.
			else {
				var pos = style.position;
				//if position is absolute - all
				if (pos === 'absolute' || pos === 'fixed'){
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
				//else - only three
				else {
					handles = {
						s: null,
						se: null,
						e: null
					};
				}

			}


			//create proper number of handles
			var handle;
			for (var direction in handles){
				//ensure handle
				handle = handles[direction];
				if (!handle) {
					handle = document.createElement('div');
				}
				handles[direction] = handle;

				//insert handle to the element
				this.element.appendChild(handle);

				//configure handle
				this.configureHandle(handle, direction);
			}

			return handles;
		}
	},

	/** proper class to append to handle */
	handleClass: 'handle',

	/** callbacks */
	resize: undefined
};


var proto = Resizable.prototype;


/** predefined handles draggable options */
var w = 10;
Resizable.handleOptions = splitKeys({
	'n,s': {
		axis: 'y'
	},
	'w,e':{
		axis: 'x'
	},
	'e,w,n,s,nw,ne,sw,se':{
		sniper: false,
		pin: w/2,
		within: null,
		threshold: 10,
		dragstart: function(e){
			var res = this.resizable,
				el = res.element;

			res.m = css.margins(el);
			res.b = css.borders(el);
			res.p = css.paddings(el);

			//save initial offsets
			elo = css.offsets(el);
			// res.offsets = [elo.left, elo.top];
			//correct offsets on static body
			res.offsets = [el.offsetLeft - res.m.left, el.offsetTop - res.m.top];


			//fix top-left position
			css(el, {
				left: res.offsets[0],
				top: res.offsets[1],
				// bottom: 'auto',
				// right: 'auto'
			});

			//recalc border-box
			if (getComputedStyle(el).boxSizing === 'border-box') {
				res.p.top = 0;
				res.p.bottom = 0;
				res.p.left = 0;
				res.p.right = 0;
				res.b.top = 0;
				res.b.bottom = 0;
				res.b.left = 0;
				res.b.right = 0;
			}

			//save initial size
			res.size = [el.offsetWidth - res.b.left - res.b.right - res.p.left - res.p.right, el.offsetHeight - res.b.top - res.b.bottom - res.p.top - res.p.bottom];

			//calc limits (max height/width)
			if (res.within) {
				var po = css.offsets(res.within);
				res.limit = [po.width - res.p.left - res.p.right - res.b.left - res.b.right - res.m.left - res.m.right, po.height - res.p.top - res.p.bottom - res.b.top - res.b.bottom - res.m.top - res.m.bottom];
			} else {
				res.limit = [Infinity, Infinity];
			}


			//preset mouse cursor
			css(root, {
				'cursor': this.element.style.cursor,
				'pointer-events': 'none'
			});
		},
		drag: function(e){
			var res = this.resizable,
				el = res.element;

			//change width & height to accord to the new position of handle
			this.resize();

			//trigger callbacks
			res.emit('resize', e);
			Enot.emit(el, 'resize', e);

			//FIXME: doubtful solution
			this.x = 0;
			this.y = 0;
		},
		dragend: function(){
			var res = this.resizable,
				el = res.element;

			//undisable selection
			css.enableSelection(root);

			//clear cursor & pointer-events
			css(root, {
				'cursor': null,
				'pointer-events': null
			});
		}
	},
	'se,s,e': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: Math.min(Math.max(res.size[0] + this.x, 0), res.limit[0] - res.offsets[0]),
				height: Math.min(Math.max(res.size[1] + this.y, 0), res.limit[1] - res.offsets[1])
			});
		}
	},
	'nw,n,w': {
		resize: function(e){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: Math.min(Math.max(res.size[0] - this.x, 0), (res.size[0] + res.offsets[0])),
				height: Math.min(Math.max(res.size[1] - this.y, 0), (res.size[1] + res.offsets[1]))
			});

			//subtract t/l on changed size
			var difX = res.size[0] + res.b.left + res.b.right + res.p.left + res.p.right - el.offsetWidth;
			var difY = res.size[1] + res.b.top + res.b.bottom + res.p.top + res.p.bottom - el.offsetHeight;

			css(el, {
				left: res.offsets[0] + difX,
				top: res.offsets[1] + difY
			});
		}
	},
	'ne': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: Math.min(Math.max(res.size[0] + this.x, 0), res.limit[0] - res.offsets[0]),
				height: Math.min(Math.max(res.size[1] - this.y, 0), (res.size[1] + res.offsets[1]))
			});

			//subtract t/l on changed size
			var difY = res.size[1] + res.b.top + res.b.bottom + res.p.top + res.p.bottom - el.offsetHeight;

			css(el, {
				top: res.offsets[1] + difY
			});
		}
	},
	'sw': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: Math.min(Math.max(res.size[0] - this.x, 0), res.size[0] + res.offsets[0]),
				height: Math.min(Math.max(res.size[1] + this.y, 0), res.limit[1] - res.offsets[1])
			});

			//subtract t/l on changed size
			var difX = res.size[0] + res.b.left + res.b.right + res.p.left + res.p.right - el.offsetWidth;

			css(el, {
				left: res.offsets[0] + difX
			});
		}
	}
}, true);


/** handles styles */
Resizable.handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se':{
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
		'left, right': -w/2,
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


/** Create handle for the direction */
proto.configureHandle = function(handle, direction){
	var opts = Resizable.handleOptions;
	var styles = Resizable.handleStyles;

	//make handle draggable
	var draggy = new Draggable(handle, opts[direction]);

	//append uninited options
	softExtend(draggy, opts[direction]);

	//save resizable reference
	draggy.resizable = this;

	//append styles
	css(handle, styles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.classList.add(this.handleClass);

	return handle;
};


/** deconstructor - removes any memory bindings */
proto.destroy = function(){
	//remove all handles
	for (var hName in this.handles){
		this.element.removeChild(this.handles[hName]);
	}

	//remove references
	this.element.resizable = null;
	this.element = null;
};


/** Make self eventable */
Enot(proto);



/**
 * @module resizable
 */
module.exports = Resizable;