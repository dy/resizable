var Draggable = require('draggy');
var state = require('st8');
var Enot = require('enot');
var css = require('mucss');
var splitKeys = require('split-keys');


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
			options[propName] = parse.attribute(target, propName, prop.init !== undefined ? prop.init : prop);
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
Resizable.handleStyles = splitKeys({
	'e,w,n,s,nw,ne,sw,se':{
		'position': 'absolute'
	},
	'e,w': {
		'top, bottom':0,
		'width':10,
		'left, right': 'auto'
	},
	'n,s': {
		'left, right': 0,
		'top, bototm': 'auto',
		'height': 10
	},
	'nw,ne,sw,se': {
		'width': 10,
		'height': 10
	},
	'nw': {
		'top, left': 0,
		'bottom, right': 'auto'
	},
	'ne': {
		'top, right': 0,
		'bottom, left': 'auto'
	},
	'sw': {
		'bottom, left': 0,
		'top, right': 'auto'
	},
	'se': {
		'bottom, right': 0,
		'top, left': 'auto'
	}
});


/** Create handle for the direction */
proto.configureHandle = function(handle, direction){
	var opts = Resizable.handleOptions;
	var styles = Resizable.handleStyles;

	//make handle draggable
	var draggy = new Draggy(handle, opts[direction]);

	//append styles
	css(handle, styles[direction]);
	css(handle, 'cursor', direction + '-resize');

	//append proper class
	handle.className += ' ' + this.handleClass;

	return handle;
};



/** Make self eventable */
Enot(proto);




/**
 * @module resizable
 */
module.exports = Resizable;