/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype

var expose = {
	loadClass: 'load',
	classes: 'classes'
};
exports.__expose = expose;

exports.Class = function(K, global){
	
	var initializing = false,
		fnTest = /xyz/.test(function() {xyz;}) ? (/\b_super\b/) : /.*/;

	// The base Class implementation (does nothing)
	function Class() {};

	// Create a new Class that inherits from this class
	Class.extend = function(prop, o) {
		// Extended with autoloading
		if (typeof prop === 'string' && o) {
			return K.loadClass(prop).extend(o);
		}

		var _super = this.prototype;
		//K.log('got prop', { prop: prop, o: o });

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super;

					// Add a new ._super() method that is the same method
					// but on the super-class
					this._super = _super[name];

					// The method only need to be bound temporarily, so we
					// remove it when we're done executing
					var ret = fn.apply(this, arguments);
					this._super = tmp;

					return ret;
				};
			})(name, prop[name]) : prop[name];
		}

		// The dummy class constructor
		// Slight modification to set init return value to default el
		var el;


		function Class(o) {
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				o && K.extend(this, o);
				(el = this.init.apply(this, arguments)) && !this.el && (this.el = el);
			}
		}

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;
		Class.__KClass = true;

		return Class;
	};
	
	var classes = Class.classes = {};
	Class.load = function(name, liveKlass){
		var klass, cls, exts, extsName;
		if(global.DEBUG || liveKlass || !(klass = classes[name])){
			if(!liveKlass){ K.loadStyle(name); }
			//klass = liveKlass||(exports = {}, Ti.include('kui/' + name + '.js'), exports.Class);
			
			/*
			klass = liveKlass || ((exp = require('kui/' + name)) && (typeof exp === 'object' && (typeof exp.Class === 'function' ? exp.Class(K) : exp.Class)) || (typeof exp === 'function' && exp(K)));
			if(typeof klass.extend !== 'function'){
				klass = K.classes[klass['extends'] || klass.ext].extend(klass);
			}
			*/
			
			klass = liveKlass || (require('/kui/' + name)).Class;
			if(typeof klass === 'function' && !klass.__KClass){
				klass = klass(K, global);
			}
			if(typeof klass === 'object' && (extsName = (klass.exts || klass['extends'])) && (exts = (classes[extsName] || Class.load(extsName))) ){
				klass = exts.extend(klass);
			}
			cls = klass.prototype.className;
			klass.prototype.className = cls ? cls + ' ' + name : name;
			klass.prototype._klass = name;
			
			classes[name] = klass;
		}
		return klass;
	};
	Class.__KClass = true;
	
	return Class;
};
