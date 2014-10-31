var Draggable = require('draggy');
var state = require('st8');
var Enot = require('enot');
var css = require('mucss');
var splitKeys = require('split-keys');
var parse = require('muparse');
var type = require('mutypes');


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

	//ensure position is absolute (the only dependable way of resizing)
	this.element.style.position = 'absolute';
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
			var handles;

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
			//default set of handles - all
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
Resizable.handleOptions = splitKeys({
	'n,w': {
		axis: 'y',
	},
	'w,e':{
		axis: 'x'
	},
	'e,w,n,s,nw,ne,sw,se':{
		sniper: false
	}
});

/** handles styles */
var w = 10;
Resizable.handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se':{
		'position': 'absolute'
	},
	'e,w': {
		'top, bottom':0,
		'width':w
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
console.log(Resizable.handleStyles.ne)

/** Create handle for the direction */
proto.configureHandle = function(handle, direction){
	var opts = Resizable.handleOptions;
	var styles = Resizable.handleStyles;

	//make handle draggable
	var draggy = new Draggable(handle, opts[direction]);

	//append styles
	css(handle, styles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.classList.add(this.handleClass);

	return handle;
};



/** Make self eventable */
Enot(proto);




/**
 * @module resizable
 */
module.exports = Resizable;