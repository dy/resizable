var css = require('mucss');
var Draggable = require('draggy');
var state = require('st8');
var Enot = require('enot');
var splitKeys = require('split-keys');
var parse = require('muparse');
var type = require('mutypes');
var softExtend = require('soft-extend');


//TODO: no styles & predefined top/left/right case (resize one edge - as placer example case)
//TODO: within resize

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
	within: undefined,

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
	handleClass: 'handle'
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
		within: root,
		threshold: 10,
		dragstart: function(e){
			var res = this.resizable,
				el = res.element;

			var margins = css.margins(el);

			//save initial offsets
			res.offsets = [el.offsetLeft - margins.left, el.offsetTop - margins.top];

			//fix position
			this.fix();

			//save initial size
			var b = css.borders(res.element);
			var p = css.paddings(res.element);
			res.size = [res.element.offsetWidth - b.left - b.right - p.left - p.right, res.element.offsetHeight - b.top - b.bottom - p.top - p.bottom];
		},
		drag: function(e){
			var res = this.resizable,
				el = res.element;

			//change width & height to accord to the new position of handle
			this.resize();

			//trigger callbacks
			this.emit('resize', e);
			Enot.emit(this.element, 'resize', e);

			//FIXME: doubtful solution
			this.x = 0;
			this.y = 0;
		}
	},
	's': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				height: res.size[1] + this.y
			});
		},
		fix: function(){
			var res = this.resizable,
				el = res.element;

			//fix top-left position
			css(el, {
				top: res.offsets[1],
				bottom: 'auto'
			});
		}
	},
	'se': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: res.size[0] + this.x,
				height: res.size[1] + this.y
			});
		},
		fix: function(){
			var res = this.resizable,
				el = res.element;

			//fix top-left position
			css(el, {
				left: res.offsets[0],
				top: res.offsets[1],
				bottom: 'auto',
				right: 'auto'
			});
		}
	},
	'e': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: res.size[0] + this.x
			});
		},
		fix: function(){
			var res = this.resizable,
				el = res.element;

			//fix top-left position
			css(el, {
				left: res.offsets[0],
				right: 'auto'
			});
		}
	},
	'n,nw,w': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: res.size[0] - this.x,
				height: res.size[1] - this.y
			});
		},

		fix: function(){
			var res = this.resizable,
				el = res.element;

			var parentRect = css.offsets(el.offsetParent);
			var selfRect = css.offsets(el);

			//fix bottom-right position
			var margins = css.margins(el);

			css(el, {
				right: parentRect.right - selfRect.right + el.draggy.x - margins.left,
				bottom: parentRect.bottom - selfRect.bottom + el.draggy.y - margins.top,
				top: 'auto',
				left: 'auto'
			});
		}
	},
	'ne': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: res.size[0] + this.x,
				height: res.size[1] - this.y
			});
		},
		fix: function(){
			var res = this.resizable,
				el = res.element;

			var res = this.resizable,
				el = res.element;

			var parentRect = css.offsets(el.offsetParent);
			var selfRect = css.offsets(el);

			//fix bottom-right position
			var margins = css.margins(el);

			css(el, {
				bottom: parentRect.bottom - selfRect.bottom + el.draggy.y - margins.top,
				left: res.offsets[0],
				top: 'auto',
				right: 'auto'
			});
		}
	},
	'sw': {
		resize: function(){
			var res = this.resizable,
				el = res.element;

			css(el, {
				width: res.size[0] - this.x,
				height: res.size[1] + this.y
			});
		},
		fix: function(){
			var res = this.resizable,
				el = res.element;

			var res = this.resizable,
				el = res.element;

			var parentRect = css.offsets(el.offsetParent);
			var selfRect = css.offsets(el);

			//fix bottom-right position
			var margins = css.margins(el);

			css(el, {
				right: parentRect.right - selfRect.right + el.draggy.x - margins.left,
				top: res.offsets[1],
				bottom: 'auto',
				left: 'auto'
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

	//prevent bubbling on handles
	Enot.on(handle, 'drag, dragstart, dragend', function(e){
		e.preventDefault();
		e.stopPropagation();
	});

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