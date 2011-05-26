/*** CORE ***/
(function(global){

global.GLOBAL = global;
win = global.win||Ti.UI.currentWindow||{};

var reTiObject = /^\[object Ti/,
	ArrayProp = Array.prototype,
	slice = ArrayProp.slice, 
	toString = Object.prototype.toString,
	noop = function(){};

	function classRE(name){ return new RegExp("(^|\\s)" + name + "(\\s|$)"); }
	function compact(array){ return array.filter(function(item){ return item !== undefined && item !== null; }); }
	function flatten(array){ return array.reduce(function(a,b){ return a.concat(b); }, []); }
	function camelize(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : ''; }); }
	function arrayify(o){ return Array.isArray(o) ? o : [o]; }

	function Z(dom, selector) {
		dom = dom||[];
		dom.__proto__ = Z.prototype;
		dom.selector = selector||'';
		return dom;
	}
	
	var $ = function(selector, context){
		if (context !== undefined) return $(context).find(selector);
		else if (selector instanceof Z) return selector;
		else {
			var dom, tmp;
			if (typeof selector === 'undefined' || selector === null || selector === '#' || selector === '') dom = [];
			else if (Array.isArray(selector)){ dom = K.create(selector); }
			else if (selector && selector.toString && reTiObject.test(selector.toString())) dom = [selector];
			else if (toString.call(selector) == '[object Object]') dom = [K.create(selector)];
			else dom = Array.isArray((tmp = $$(selector, null))) ? tmp : [tmp];			
			return Z(dom, selector);
		}
	};

	var block;
	$.fn = {
		forEach: ArrayProp.forEach,
		map: ArrayProp.map,
		reduce: ArrayProp.reduce,
		push: ArrayProp.push,
		indexOf: ArrayProp.indexOf,
		concat: ArrayProp.concat,
		get: function(idx){ 
			return idx === undefined ? 
				slice.call(this) : 
				(idx < 0 ? this[this.length + idx] : this[idx]); 
		},
		set: function(prop, val){
			var props = (typeof prop === 'string') ? [{ key: prop, val: val }] : Object.keys(prop).map(function(key){ return { key: key, val: prop[key] }; }),
				i, o;
			this.each(function(){
				i = props.length;
				while((o = props[--i])){
					this[o.key] = o.val;
				}
			});
		},
		slice: function(start, end){			
			return K(slice.call(this, start, end === 0 ? undefined : end));
		},
		toArray: function(){ return slice.call(this); },
		size: function(){ return this.length; },
		rem: function(){ alert('WOOOT'); },
		remove: function(){

			return this.each(
				function(){
					var el = this, index, arr;
				
					(el.className||"").split(/\s+/).forEach(function(cls){
						if(cls && (index = K.elsByClassName[cls].indexOf(el)) != -1){
							K.elsByClassName[cls].splice(index, 1); 
						}
					});

					if((arr = K.elsByName[el._type]) && ((index = arr.indexOf(el)) != -1)){
						K.elsByName[el._type].splice(index, 1);
					}
					if(el._id && K.elsById[el._id]){
						delete K.elsById[el._id];
					}
					try { el.getParent().remove(el); } catch(e){ Ti.API.error(e); }
				}
			); 
		},
		each: function(callback){
			this.forEach(function(el, idx){ callback.call(el, idx, el); });
			return this;
		},
		filter: function(selector){
			return $(ArrayProp.filter.call(this, function(element){
				return $$(selector, element.getParent()).indexOf(element) >= 0;
			}));
		},
		is: function(selector){
			return this.length > 0 && $(this[0]).filter(selector).length > 0;
		},
		eq: function(idx){ idx = parseInt(idx, 10); return $(this).slice(idx, idx + 1); },
		add: function(els){
			return $(this.concat(Array.isArray(els) ? els : [els]));
		},
		first: function(){ return $(this[0]); },
		last: function(){ return $(this[this.length - 1]); },
		find: function(selector){
			var result;
			if (this.length == 1) result = $$(selector, this[0]);
			else result = flatten(this.map(function(el){ return $$(selector, el); }));
			return $(result);
		},
		closest: function(selector, context){
			var node = this[0],
				nodes = $$(selector, context); //context !== undefined ? context : document);
			
			if (nodes.length === 0) node = null;
			while (node && nodes.indexOf(node) < 0) { node = node.getParent(); };
			return $(node);

		}, //TODO: implement me
		parents: function(){}, //TODO: implement me
		parent: function(selector){
			var node, nodes = [];
			this.each(function(){
				if ((node = this.getParent()) && nodes.indexOf(node) < 0) nodes.push(node);
			});
			nodes = $(nodes);
			return selector === undefined ? nodes : nodes.filter(selector);
		},
		children: function(selector){
			var children, nodes = [];
			this.each(function(){
				(this.children||[]).forEach(function(child){	
					child && (nodes.indexOf(child) < 0) && nodes.push(child);
				});
			});
			nodes = $(nodes);
			return selector === undefined ? nodes : nodes.filter(selector);
		},
		siblings: function(){}, //TODO: implement me
		pluck: function(property){ return this.map(function(element){ return element[property]; }); },
		show: function(o){ return this.each(function(){ this.show(o); }); },
		hide: function(){ return this.each(function(){ this.hide(); }); },
		prev: function(){}, //TODO: implement me
		next: function(){}, //TODO: implement me
		val: function(val){
			return val === undefined ? (this.length > 0 ? this[0].value : null) : this.each(function() {
				this.value = val;
			});
		}, //TODO: implement me
		offset: function(){}, //TODO: implement me
		css: function(property, value) {
			if (value === undefined && typeof property == 'string') return this[0][camelize(property)];
			if(typeof property == 'string' && typeof value != 'undefined'){
				var p = property;
				property = {};
				property[p] = value;
			}
			return this.each(function() {
				for (key in property){
					this[key] = property[key];
				}
			});
		},
		index: function(element){
			return this.indexOf($(element)[0]);
		},
		hasClass: function(name){
			return classRE(name).test(this[0].className);
		},
		addClass: function(name){
			return this.each(function(){
				!$(this).hasClass(name) && (this.className += (this.className ? ' ' : '') + name);
			});
		},
		removeClass: function(name){
			return this.each(function(){
				this.className = this.className.replace(classRE(name), ' ').trim();
			});
		},
		toggleClass: function(name, when){
			return this.each(function(){
			 	((when !== undefined && !when) || $(this).hasClass(name)) ?
			 	$(this).removeClass(name) : $(this).addClass(name);
			});
		},
		append: function(els){
			var parent = this[0],
				els = arrayify(els);
			switch(parent){
				default:
					els.forEach(function(el){
						el = K.create(el);
						parent.add(el); 	
					});
					break;
			}
			return this;
		},
		appendTo: function(parent){
			if(typeof parent === 'string'){
				parent = K(parent).get(0);
			}
			switch(parent&&parent._type){
				case 'mapview':
					return this.each(function(){
						parent.addAnnotation(this);
					});
					break;
					
				default:
					return this.each(function(){
						parent.add(this);
					});
					break;
			}
			return this;
		},
		bind: function(name, fn, ctx){
			return this.each(function(){
				var el = this,
					events = (el._events = el._events||{}),
					boundFn = fn.bind(ctx || el);
					
				(events[name] = events[name]||[]).push(boundFn);
				
				el.addEventListener(name, boundFn);
			});
		},
		unbind: function(name){
			return this.each(function(el){
				var toUnbind = [], fns;
				if(name && el._events && (fns = el._events[name])){
					toUnbind = fns.map(function(fn){ return { name: name, fn: fn }; });
				} else if (el._events){
					Object.keys(el._events).forEach(function(name) {
						(el._events[name]).forEach(function(fn) {
							toUnbind.push({
								name: name,
								fn: fn
							});
						});
					});
				}
				toUnbind.forEach(function(o){
					el.removeEventListener(o.name, o.fn);	
				});
			});
		},
		open: function(parent, o){
			var el = this[0];
			if(el){
				switch(el._type){
					case 'window':
						if(parent == 'tab'){
							if(block){ return; } else { block = true; }
							
							el.addEventListener('open', function(){ block = false; });
							K.currentWindow = el;
							
							var tab = ((tmp = ((o&&o.tab)||o) ) && (typeof tmp === 'string') ? $$(tmp)[0] : tmp) || ((tmp = $$('tabgroup')) && tmp[0] && tmp[0].activeTab);
							(tab||Ti.UI.currentTab).open(el, o||{});
						} else if(parent && (parent && parent._type ? parent : (parent = $$(parent)[0])) && ['navigationgroup', 'tabgroup'].indexOf(parent._type) !== -1) {
							parent.open(el, o||{});
						} else {
							el.open();
						}
						break;
						
					default:
						el.open && el.open(parent && K.create(parent, { type: 'window' }), o);
						break;
				}
			}
			return this;
		},
		close: function(t){
			var el = this[0];
			el && el.close && el.close();
			return this;
		},
		text: function(text) {
			return text === undefined ? (this.length > 0 ? (this[0].text||this[0].title) : null) : this.each(function() {
				this.text = this.title = text;
			});
		},
		animate: function(opts, cb){
			return this.each(function(i){
				this.animate(opts, (i == 0 ? cb||noop : noop));
			});
		},
		
		trigger: function(event, obj){
			return this.each(function(i){
				this.fireEvent(event, obj);
			});
		},
		
		replaceWith: function(el){
			var $parent;
			return this.each(function(i){
				K(this).children().remove();
				this.add(K.create(el));
			});
		}

	};
	
	$.each = function(obj, iterator){
		(obj||[]).forEach(function(el){
			iterator.call(el, el);
		});
	}

	Z.prototype = $.fn;
	global.$ = global.K = global.jQuery = global.Zepto = $;
	
	
})(this);




/*** UTILS ***/
//(function(global){

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

K.get = function(str){ return JSON.parse(Ti.App.Properties.getString(str)); };
K.set = function(str, val){ return Ti.App.Properties.setString(str, JSON.stringify(val)); };

K.alert = function(message, title){
	Ti.UI.createAlertDialog({
        title: title || 'Obs!',
        message: message
    }).show();
};

var android = Ti.Platform.osname === 'android';
K.log = function(a, b){
	var out = (b ? Array.prototype.slice.call(arguments) : a);
	Ti.API.log("Kranium", android ? JSON.stringify(out) : out);
};

K.loadify = function(el, fn){
	var p = el||GLOBAL.win||Ti.UI.currentWindow,
		done;
		
	if(!p){ return; } 
	
	if(p && !p._loader){
		p._loader = K.createActivityIndicator({
			className: 'loader',
		});
				
		p.add(p._loader);
	}
	
	p._loader.show();
	
	if(fn){ // Test if func
		done = function(){ K.doneify(el); };
		if(typeof fn(done) !== 'undefined'){
			done();
		}
	}
};

K.doneify = function(el){
	var p = el||GLOBAL.win||Ti.UI.currentWindow;	
	p && p._loader && setTimeout(p._loader.hide, 500);
};

K.parseJSON = JSON.parse;

function singleExtend(destination, source){
	var property;
	for (property in source) { destination[property] = source[property]; }
	return destination;
}
/**
 * Merge any number of objects where the rightmost has precedence
 * @param obj... Object to be merged
 * @return Object with all arguments merged
 */
var extend = K.extend = function(obj1, obj2, obj3){
	if(!obj3){
		return singleExtend(obj1, obj2);
	} else {
		var args = Array.prototype.slice.call(arguments),
			obj = args.shift();
		while(args.length){ obj = singleExtend.apply(null, [obj, args.shift()]); }
		return obj;
	}
};

function singleDeepExtend(destination, source){	
	for (var property in source) {
		if (source[property] && source[property].constructor && source[property].constructor === Object) {
			destination[property] = destination[property] || {};
			singleDeepExtend(destination[property], source[property]);
		} else {
			destination[property] = source[property];
		}
	}
	return destination;
}

K.deepExtend = function(obj1, obj2, obj3) {
	if(!obj3){
		return singleDeepExtend(obj1, obj2);
	} else {
		var args = Array.prototype.slice.call(arguments),
			obj = args.shift();
		while(args.length){ obj = singleDeepExtend.apply(null, [obj, args.shift()]); }
		return obj;
	}
};

if(!Object.prototype.ext){
	Object.defineProperty(Object.prototype, "ext", {
	    enumerable: false,
	    value: function(from) {
	        var dest = this;
			for(var prop in from){
				dest[prop] = from[prop];
			}
	        return this;
	    }
	});
}


if(!Object.prototype.clone){
	Object.defineProperty(Object.prototype, "clone", {
	    enumerable: false,
	    value: function() {
	        return ({}).ext(this);
	    }
	});
}

if(!Object.prototype.sanitize){
	Object.defineProperty(Object.prototype, "sanitize", {
	    enumerable: false,
	    value: function(props) {
			var me = this.clone();
			(props||[]).forEach(function(prop){
				delete me[prop];
			});
	        return me;
	    }
	});
}

if(!Object.prototype.or){
	Object.defineProperty(Object.prototype, "or", {
	    enumerable: false,
	    value: function(val) {
	        return Array.isArray(this) ? (this.length === 0 ? val : this) : (JSON.stringify(this) === '{}' ? val: this);
	    }
	});
}

if(!Object.prototype.arrayify){
	Object.defineProperty(Object.prototype, "arrayify", {
	    enumerable: false,
	    value: function() {
	        return Array.isArray(this) ? this : [this];
	    }
	});
}

if(!Object.prototype.defer){
	Object.defineProperty(Function.prototype, "defer", {
	    enumerable: false,
	    value: function(ms, _scope) {
			var fn = this; 
			return function(){
				var scope = (_scope && this === arguments.callee) ? _scope : this,
					args = Array.prototype.slice.call(arguments);
				
				setTimeout(function(){ fn.apply(scope||fn, args); }, ms);
			};
	    }
	});
}

Number.prototype.round = function(n){
	var n = n || 0, pow = Math.pow(10, n);
	return (Math.round(this * pow) / pow).toFixed(n >= 0 ? n : 0);
};

if (!Array.prototype.remove) {
    Array.prototype.remove = function(elem, max) {
        var index, i = 0;
        while((index = this.indexOf(elem)) != -1 && (!max || i < max)) {
            this.splice(index, 1);
            i++;
        }
        return this;
    };
}	

/*
 * Bind a function to a context
 * @param ctx Context to run the function in
 * @return Function applying new scope to original function
 */
var slice = Array.prototype.slice;
Function.prototype.bind = function(ctx){ 
	var fn = this;
	return function(){ 
		fn.apply(ctx || fn, slice.call(arguments)); 
	}; 
};

var slice = Array.prototype.slice;
Function.prototype.once = function(ctx){ 
	var fn = this, i = 0;
	return function(){ 
		return ++i <= 1 && fn.apply(ctx || fn, slice.call(arguments)); 
	}; 
};

/**
 * Convert camelCase to dashed notation
 * @return String with uppercase letters converted to dashed notation
 */
String.prototype.toDash = function(){
	return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};

/**
 * Convert dashed notation to camelCase
 * @return String with dashed notation converted to camelCase
 */
String.prototype.toCamel = function(){
	return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

/**
 * Trim a string of leading and trailing whitespace
 * @return String trimmed of whitespace
 */
var rtrim = /^\s+|\s+$/g;
String.prototype.trim = function(){
	return this.replace(rtrim, "");	
};

String.prototype.esc = function(obj, func){
    return this.replace(/#\{([A-Za-z_]+)\}/g, function($0, $1){
        return typeof obj[$1] != "undefined" ? (func ? func(obj[$1]) : obj[$1]) : $0;
    });
};

//})(this);

/*** QSA ***/
/**
 * "mini" Selector Engine
 * Copyright (c) 2009 James Padolsey
 * -------------------------------------------------------
 * Dual licensed under the MIT and GPL licenses.
 *    - http://www.opensource.org/licenses/mit-license.php
 *    - http://www.gnu.org/copyleft/gpl.html
 * -------------------------------------------------------
 * Version: 0.01 (BETA)
 */

$.qsa = $$ = (function(document, global){
	
	var me = document;
	[
		{ fn: "getElementsByClassName", arrName: "elsByClassName" },
		{ fn: "getElementsByTagName", arrName: "elsByName" },
		{ fn: "getElementById", arrName: "elsById" }
	].forEach(function(o){
		var name = o.fn, 
			arrName = o.arrName,
			singular = (o.fn == "getElementById"), 
			a, 
			res;

		me[name] = global[name] = function(s, context){
			var arr = K[arrName],
				res = null;

			if((a = arr[s]) && (a = (Array.isArray(a) ? a : [a]))){
				if(context){
					res = a.filter(function(el){
						do {
							if(el._uuid === context._uuid){ return true; }
						} while((el = (el.getParent()) ));
						return false;
					});
				} else {
					res = a;
				}
			}

			return singular ? Array.isArray(res) && res[0] : res;
		};
	});
	
	
    var snack = /(?:[\w\-\\.#]+)+(?:\[\w+?=([\'"])?(?:\\\1|.)+?\1\])?|\*|>/ig,
        exprClassName = /^(?:[\w\-_]+)?\.([\w\-_]+)/,
        exprId = /^(?:[\w\-_]+)?#([\w\-_]+)/,
        exprNodeName = /^([\w\*\-_]+)/,
        na = [null,null];

    function _find(selector, context) {
        /**
         * This is what you call via x()
         * Starts everything off...
         */
        var simple = /^[\w\-_#]+$/.test(selector);
		
        if (selector.indexOf(',') > -1) {
            var split = selector.split(/,/g), ret = [], sIndex = 0, len = split.length;
            for(; sIndex < len; ++sIndex) {
                ret = ret.concat( _find(split[sIndex], context) );
            }
            return unique(ret);
        }

        var parts = selector.match(snack),
            part = parts.pop(),
            id = (part.match(exprId) || na)[1],
            className = !id && (part.match(exprClassName) || na)[1],
            nodeName = !id && (part.match(exprNodeName) || na)[1],
            collection,
			el;

        if (className && !nodeName) {
            collection = realArray(getElementsByClassName(className, context));
        } else {
            collection = !id && realArray(getElementsByTagName(nodeName||'*', context));
			if (className) {
                collection = filterByAttr(collection, 'className', RegExp('(^|\\s)' + className + '(\\s|$)'));
            }
            if (id) {
                return (el = getElementById(id, context)) ? [el] : [];
            }
        }
		
		var ret = parts[0] && collection[0] ? filterParents(parts, collection, false, context) : collection;
		return ret;
    }

    function realArray(c) { return Array.prototype.slice.call(c); }

    function filterParents(selectorParts, collection, direct, context) {
        /**
         * This is where the magic happens.
         * Parents are stepped through (upwards) to
         * see if they comply with the selector.
         */

        var parentSelector = selectorParts.pop()||'';
        if (parentSelector === '>') { return filterParents(selectorParts, collection, true, context); }

        var ret = [],
            r = -1,
            id = (parentSelector.match(exprId) || na)[1],
            className = !id && (parentSelector.match(exprClassName) || na)[1],
            nodeName = !id && (parentSelector.match(exprNodeName) || na)[1],
            cIndex = -1,
            node, parent,
            matches;

        while ( (node = collection[++cIndex]) ) {
            if(context){
				if(node.getParent()._uuid == context._uuid){
					ret[++r] = node;
				}
			} else {
				parent = node.getParent();
	            do {
	                matches = !nodeName || nodeName === '*' || nodeName === parent._type;
	                matches = matches && (!id || parent._id === id);
	                matches = matches && (!className || RegExp('(^|\\s)' + className + '(\\s|$)').test(parent.className));
	                if (direct || matches) { break; }
	            } while ( (parent = parent.getParent()) );
	            if (matches) { ret[++r] = node; }
			}
			
        }
        return selectorParts[0] && ret[0] ? filterParents(selectorParts, ret) : ret;
    }


    var unique = (function() {
		var uid = +new Date(),
			data = (function() {

			var n = 1;
			return function(elem) {
				var cacheIndex = elem[uid],
					nextCacheIndex = n++;

				if (!cacheIndex) {
					elem[uid] = nextCacheIndex;
					return true;
				}
				return false;
			};

		})();

		return function(arr) {
			/**
			 * Returns a unique array
			 */
			var length = arr.length,
				ret = [],
				r = -1,
				i = 0,
				item;

			for (; i < length; ++i) {
				item = arr[i];
				if (data(item)) { ret[++r] = item; }
			}

			uid += 1;
			return ret;
		};
	})();

    function filterByAttr(collection, attr, regex) {
        /**
         * Filters a collection by an attribute.
         */
        var i = -1, node, r = -1, ret = [];
        while ( (node = collection[++i]) ) {
            if (regex.test(node[attr])) {
                ret[++r] = node;
            }
        }
        return ret;
    }
    return _find;

})(this, this);

/*** KLASS ***/
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(global){
	
	K.classes = {};
	K.loadClass = function(name, liveKlass){
		var klass, cls;
		if(global.DEBUG || liveKlass || !(klass = K.classes[name])){
			if(!liveKlass){ K.loadStyle(name); }
			klass = liveKlass||(exports = {}, Ti.include('kui/' + name + '.js'), exports.Class);
			cls = klass.prototype.className;
			klass.prototype.className = cls ? cls + ' ' + name : name;
			klass.prototype._klass = name;
			
			K.classes[name] = klass;
		}
		return klass;
	};


	var initializing = false,
		fnTest = /xyz/.test(function() {xyz;}) ? /\b_super\b/ : /.*/;

	// The base Class implementation (does nothing)
	this.Class = function() {};

	// Create a new Class that inherits from this class
	Class.extend = function(prop, o) {
		// Extended with autoloading
		if (typeof prop === 'string' && o) {
			return K.loadClass(prop).extend(o);
		}

		var _super = this.prototype;

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

		return Class;
	};

})(this);

/*** FILE ***/
(function(){
	
	var pathMap = {
		res: Ti.Filesystem.resourcesDirectory,
		resources: Ti.Filesystem.resourcesDirectory,
		tmp: Ti.Filesystem.tempDirectory,
		temp: Ti.Filesystem.tempDirectory,
		app: Ti.Filesystem.applicationDirectory,
		data: Ti.Filesystem.applicationDataDirectory,
		support: Ti.Filesystem.applicationSupportDirectory
	};

	K.file = function(file){
		var parts = file.match(/((\w+):\/\/)?(.*?\.?)(\w+)$/),
			dir = pathMap[parts[2]||'res']||pathMap.res,
			path = parts[3]+parts[4];
		
		
		var f = Ti.Filesystem.getFile(dir, path), res = f;
	
		try {
			switch(parts[4]){
				case 'txt':
				case 'js':
				case 'kss':
				case 'html':
				case 'css':
					res = f.exists() ? f.read().text : false;
					break;
			}
		} catch(e){ Ti.API.error(e); }
		return res;
	};

})();

/*** STYLE ***/
(function(global){
	
	var styles = K.styles = {},
		extend = K.extend;
		
	K.extendStyle = K.addStyle = function(opts){
		K.extend(styles, opts || {});
	};

	// The current window - added to K._els to achieve immediate styling
	var thisWindow = (Ti.UI.currentWindow || global.win) || {};
	thisWindow._type = 'window';

	var els = K._els = K._els || [thisWindow];
	var styleCache = {};

	/**
	 * Calculating style for object
	 * @param opts Object containing options OR String containing selector
	 * @param type String type of object
	 * @return Object of calculated style 
	 */
	var getStyle = K.getStyle = function(opts, type){
		var i;
		if(typeof opts === 'string'){ opts = { className: opts }; }
		var elStyle, c, hash = type+(opts && opts.cls+opts.className);
		if (!(elStyle = styleCache[hash])) {
			elStyle = styles[type] ? extend({}, styles[type]) : {};
			if (opts && (c = (opts.className || opts.cls))) {
				var parts = c.split(" "), len = parts.length;
				for (i = 0; i < len; i++) {
					if ((s = styles['.'+parts[i]])) {
						elStyle = extend(elStyle, s);
					}
				}
			}
			styleCache[hash] = elStyle;
		}
		return extend({}, elStyle);
	};

	/**
	 * Refresh all styles with optional style injection
	 * @param styleString String containing JSS to be parsed and injected into style. Optional.
	 */
	K.refreshStyles = function(styleString, _els){
		if(styleString){
			styleCache = {};
			K.style(null, styleString);
		} 
		(_els ? (Array.isArray(_els) ? _els : [_els]) : els).forEach(function(el){
			var s = K.getStyle(el, el._type), p;
			for(p in s){
				el[p] = s[p];
			}
		});	
	};

	K.parseRule = function(prop, obj){
		var m, val, camelized, obj = obj || {};
		
		m = prop.value.match(rEvalProp);
		value = prop.value;
		property = prop.property.trim();
		
		//Ti.API.log('property', { property: property, hascamel: !!property.toCamel })
	
		//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', m]);

		if(m && m[0]){
			//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', eval('('+value.substring((m[1] && m[1].length) || 0)+')')]);
			obj[property] = eval('('+value.substring((m[1] && m[1].length) || 0)+')');
		} else {
			switch((camelized = property.toCamel())){
				case 'shadowOffsetX':
					(obj.shadowOffset = obj.shadowOffset || {}).x = parseFloat(value);
					break;
				case 'shadowOffsetY':
					(obj.shadowOffset = obj.shadowOffset || {}).y = parseFloat(value);
					break;
				
				case 'fontFamily':
				case 'fontWeight':
				case 'fontSize':
					obj.font = obj.font || {};
					obj.font[camelized] = value;
					break;
				
				case 'backgroundGradient':
					var parts = value.match(/(\w+)-gradient\((\w+)\s?(\w+)?\s*,\s*(.*)\)/),
						gradientType = parts[1],
						gradientStartX = parts[2],
						gradientStartY = parts[3],
						colors = parts[4].split(",").map(function(c){ var p = c.match(/(\w+)\s+([\d.]+)/); return p && {color: '#'+p[1], position: p[2]}; });
					
						obj.backgroundGradient = { type: gradientType, colors:colors };
						//Ti.API.log('grad', JSON.stringify(obj.backgroundGradient));
						//Ti.API.log('OBJ', [gradientType, colors]);
					break;	
				
				default:
					if(camelized == 'backgroundImage'){ Ti.API.log('info', JSON.stringify(value)); }
					obj[camelized] = value;
					break; 
			}
		}
		
		return obj;
	};

	/**
	 * Parse and apply styles found in specified file or in call
	 * @param file Filename containing styles. Optional
	 * @param str String containing styles. Optional
	 */
	var rEvalProp = /^(=)?(Ti|Titanium)?/;
	K.style = function(file, str, applyStyles){
		try {
			if(!str){
				/*var h = file && Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, file.substring(1).replace(/\//g, '-')),
					tmp = h && h.exists && (h.read() || {}).text;
				
				str = tmp || Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, file).read().text;*/
				str = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file).read().text;
			}
			var selectors = K.buildSelectorTree(str), m, val, prop, camelized;
			(selectors || []).forEach(function(sel){
				var obj = styles[sel.selector] = styles[sel.selector] || {};
				for(var i = 0, len = sel.properties.length; i < len; i++){
					K.parseRule(sel.properties[i], obj);
				}
				//sel.properties.forEach(K.parseRule);
				
				if(applyStyles){
					K(sel.selector).each(function() {
						var el = this;
						for(var property in obj){
							el[property] = obj[property];
						}
					});
				}
				
			});
		
			K.refreshStyles(); // Refresh styles
		} catch(e){ Ti.API.log('style apply error', e); }
	};

	K.loadStyle = function(filename){
		var contents, tmp, path = 'kss/' + filename + '.kss';
		K.log('Loading styles for ' + filename);
		if( (contents = K.file('res://'+path)) ){
			K.style(null, contents);
		}
	};

	function forEach(object, callback, reverse) {
		var name, i = 0, value,
			length = object.length,
			isObj = length === UNDEFINED;

		if (isObj) {
			for (name in object) {
				if (object.hasOwnProperty(name)) {
					if (callback.call(object[name], name, object[name]) === FALSE) {
						break;
					}
				}
			}
		} else {
			for (value = object[0]; i < length && callback.call(value, i, value) !== FALSE; value = object[++i]) {
				continue;
			}
		}
	}

	var WHITESPACE_CHARACTERS = /\t|\n|\r/g,
		EMPTY_STRING = "",
		PLACEHOLDER_STRING = "$1",
		END_MUSTACHE = "}",
	
		// Minification optimizations
		TRUE = true,
		FALSE = false,
		NULL = null,
		UNDEFINED = undefined;

		var psuedoMatchers = {
			android: Ti.Platform.osname === 'android',
			ios: Ti.Platform.osname === 'iphone'
		};
		K.buildSelectorTree = function(text) {
			var rules = [], ruletext, rule,
				match, selector, psuedo, pidx, proptext, splitprop, properties, sidx, prop, val;

			// Tabs, Returns
			text = text.replace(WHITESPACE_CHARACTERS, EMPTY_STRING);
			// Leading / Trailing Whitespace
			text = text.replace(/\s?(\{|\:|\})\s?/g, PLACEHOLDER_STRING);
			//Ti.API.log('t1', text);
			ruletext = text.split(END_MUSTACHE);
			//Ti.API.log('t2', ruletext);
			forEach(ruletext, function (i, text) {
				if (text) {
					rule = [text, END_MUSTACHE].join(EMPTY_STRING);
					match = (/(.*)\{(.*)\}/).exec(rule);

					if (match && match.length && match[2]) {
						selector = match[1];

						proptext = match[2].split(";");
						properties = [];

						forEach(proptext, function (i, x) {
							sidx = x.indexOf(":");
							prop = x.substring(0, sidx).trim();
							val = x.substring(sidx+1).trim();

							if (prop) {
								properties.push({ property : prop, value : val });
							}
						});


						if (
							selector && 
							properties.length && 

							(pidx = selector.indexOf(":")) === -1 ? 
								true : 
								(
									(psuedo = selector.match(/:[^:]+/g)) && 
									(selector = selector.substring(0, pidx)) && 
									(psuedo.filter(function(p){ 
										return psuedoMatchers[p.substring(1)]; 
									}).length === psuedo.length)
								)

						) {
							rules.push({ selector : selector, properties : properties });
						}
					}
				}
			});

			return rules;
		};

		K.loadStyle('app');

})(this);

/*** CREATE ***/
//TODO: make event delegating more backboney

(function(global){
	
	// Function returning constructor string from type string
	var rrep = /^(\w)(\w+)/,
		rfunc = function($0, $1, $2){
			return $1.toUpperCase() + $2;
		};

	var creators = {};
	K.creators = creators;	
	
	function defaultInit(o){
		//Ti.API.log('defi', { o: o, t: this });
		var t = extend({}, this, { collection: false });
		var el = (creators[this.type]||K.create)(o ? extend(t, o) : t);
		el._props = o;
	    return (this.el = el);
	}

	function forceLoad(){
		Ti.UI.create2DMatrix(); Ti.UI.create3DMatrix(); Ti.UI.createActivityIndicator(); Ti.UI.createAlertDialog(); Ti.UI.createAnimation(); Ti.UI.createButton(); Ti.UI.createButtonBar(); Ti.UI.createCoverFlowView(); Ti.UI.createDashboardItem(); Ti.UI.createDashboardView(); Ti.UI.createEmailDialog(); Ti.UI.createImageView(); Ti.UI.createLabel(); Ti.UI.createMaskedImage(); Ti.UI.createOptionDialog(); Ti.UI.createPicker(); Ti.UI.createPickerColumn(); Ti.UI.createPickerRow(); Ti.UI.createProgressBar(); Ti.UI.createScrollView(); Ti.UI.createScrollableView(); Ti.UI.createSearchBar(); Ti.UI.createSlider(); Ti.UI.createSwitch(); Ti.UI.createTab(); Ti.UI.createTabGroup(); Ti.UI.createTabbedBar(); Ti.UI.createTableView(); Ti.UI.createTableViewRow(); Ti.UI.createTableViewSection(); Ti.UI.createTextArea(); Ti.UI.createTextField(); Ti.UI.createToolbar(); Ti.UI.createView(); Ti.UI.createWebView(); Ti.UI.createWindow();
		Ti.UI.iPad.createSplitWindow();
		Ti.UI.iPad.createPopover();
		Ti.UI.iPhone.createNavigationGroup();
		
		Ti.Map.createMapView();
		Ti.Map.createAnnotation();
		
		Ti.UI.iPhone.SystemButtonStyle.BORDERED;
		Ti.UI.iPhone.TableViewStyle.GROUPED;
		
		Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
		Ti.UI.iPhone.ActivityIndicatorStyle.BIG;
	}

	var defaultCreators = {};
	
	var extraCreators = {
		TableViewRow: 'Row',
		TableViewSection: 'Section',
		ImageView: 'Image',
		MapView: 'Map',
		ActivityIndicator: 'Indicator'
	};
	
	var moduleByType = {
		splitwindow: Ti.UI.iPad,
		navigationgroup: Ti.UI.iPhone,
		popover: Ti.UI.iPad,
		mapview: Ti.Map,
		annotation: Ti.Map
		// Add media modules
	};
	
	var factoryModifier = {
		mapview: 'View'
	};
	
	function functionifyEventString(fn, to){
		if(typeof fn === 'string') { 
			return function(e){
				var value = e.value, 
					s = e.source,
					c;
					
				switch(s&&s._type){
					case 'tabbedbar':
						value = s.labels[e.index];
						break;
				}
				value = (value && value.value)||value;
				e.value = value;
								
				if(to && to[fn]){
					to[fn](e);
				} else {
					(to||Ti.App).fireEvent(fn, K.extend({ value: value }, e).sanitize(["type", "source"]));
				}
				
				/*Ti.API.log('going to fire', { fn: fn, to: to, value: value });
				(to||Ti.App).fireEvent(fn, K.extend({ value: value }, e).sanitize(["type", "source"])); */
			} 
		} else {
			return fn
		}
	}
	
	var extend = K.extend;
	["2DMatrix", "3DMatrix", "ActivityIndicator", "AlertDialog", "Animation", "Annotation", "Button", "ButtonBar", "CoverFlowView", "DashboardItem", "DashboardView", "EmailDialog", "ImageView", "Label", "MapView", "MaskedImage", "NavigationGroup", "OptionDialog", "Picker", "PickerColumn", "PickerRow", "Popover", "ProgressBar", "ScrollView", "ScrollableView", "SearchBar", "Slider", "SplitWindow", "Switch", "Tab", "TabGroup", "TabbedBar", "TableView", "TableViewRow", "TableViewSection", "TextArea", "TextField", "Toolbar", "View", "WebView", "Window"].forEach(function(t){
		var type = t.toLowerCase(),
			module = moduleByType[type]||Ti.UI,
			factoryString = 'create' + (factoryModifier[type]||t),
			extra,
			_silent = false;

			global[t] = K.classes[type] = Class.extend({
		        type: type,
		        init: defaultInit
			});

		K[factoryString] = K.creators[type] = function(opts){
			opts = opts||{};
			if(opts._type){ return opts; }
			if(opts.silent === true){ _silent = true; }
			var o = extend(K.getStyle(opts, type), opts), 
				silent = (silent||o.silent), 
				children, 
				cls, 
				id;

			if(o.children){
				if(K.isFunc(o.children)){ children = o.children(); } 
				else { children = o.children; }
				delete o.children;
			}

			if(o.id){
				id = o.id;
				delete o.id;
			}
			switch(type){
				case 'window':
					if(o.rightNavButton){ o.rightNavButton = K.create(o.rightNavButton, { type: 'button' }); }
					if(o.leftNavButton){ o.leftNavButton = K.create(o.leftNavButton, { type: 'button' }); }
					break;
					
				case 'tableviewrow':
					if(o.leftImage && /^http/.test(o.leftImage)){
						(children||[]).push({ type: 'imageView', image: o.leftImage, className: 'leftImage' });
						delete o.leftImage;
					}
					break;

				case 'tableview':
					//o.data = K.create(o.data||[]);
					o.data = o.data ? K.create(o.data, { type: 'row' }) : [];
					
					if(o.footerView){ o.footerView = K.createView(o.footerView); }
					if(o.headerView){ o.headerView = K.createView(o.headerView); }
					if(o.search){ o.search = K.createSearchBar(o.search); }
					break;

				case 'tableviewsection':
					if(K.isFunc(o.rows)){ o.rows = o.rows(); }
	 				if(o.headerTitle){ o.headerView = K.createView({ className: 'headerView', children: [{ type: 'label', text: o.headerTitle, className: 'headerLabel' }, { type: 'view', className: 'headerBack' }] }); }
					delete o.headerTitle;
					if(o.headerPlain){ o.headerTitle = o.headerPlain; }
					o.rows = (o.rows || []).map(K.createTableViewRow);
					break;

				case 'toolbar':
					o.items = (o.items || []).map(function(child){
						if(child === 'spacer' || child === 'flexSpace'){ child = { systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }; }
						if(typeof child === 'string'){
							child = {
								type: child
							};
						}
						
						if(!(child.className)){
							child.className = 'toolbarButton';
						}
						return K.create(child, { type: 'button' });
					});
					break;

				case 'tab':
					o.window = K.create(o.window, { type: 'window' });
					break;

				case 'tabgroup':
					K.log('create tabgroup', o.tabs);
					//if(o.tabs){ o.tabs = K.create(o.tabs, { type: 'tab' }); }

					o._tabs = o.tabs;
					delete o.tabs;
					break;
					
				case 'splitwindow':
					o.masterView = K.create(o.masterView, { type: 'navigationgroup' });
					o.detailView = K.create(o.detailView, { type: 'navigationgroup' });
					break;
					
				case 'navigationgroup':
					o.window = K.createWindow(o.window);
					break;
					
				case 'scrollableview':
					o.views = K.create(o.views);
					break;
					
			}

			delete o.type;
			if(typeof o.intype !== 'undefined'){
				o.type = o.intype;
				delete o.intype;
			}
			var el = module[factoryString](o);
			el._uuid = ++uuid;
			el._type = type;
			el._opts = opts;
			el._id = id;

			switch(type){
				case 'activityIndicator':
					el.show();
					break;

				case 'tabgroup':
					if(o._tabs){ 
						o._tabs.forEach(function(tab){
							el.addTab(K.createTab(tab));
						});
					}
					break;
					
				case 'picker':
					(o.rows||[]).forEach(function(row){

						var pickerRow = K.createPickerRow(
							(row.title && Object.keys(row) > 1) || el.addRowClass ?
							{ _title: row.title, children: [K.extend({ type: 'label', text: row.title, className: el.addRowClass, width: 'auto', height: 'auto' }, row)] } : 
							row
						);

						Ti.API.log('pr', { el: pickerRow, children: pickerRow.children })

						el.add(
							pickerRow
						);
					});
					break;
					
				case 'window':
					if(o.loadify){ K.loadify(el); }
					break;
			}

			(children || []).forEach(function(child){
				//child.parentNode = el;
				el.add(K.create(child));
			});

			if(!_silent){
				if((classes = (o.className || o.cls))){
					classes.split(/\s+/).forEach(function(cls){
						if(cls){
							(K.elsByClassName[cls] = K.elsByClassName[cls] || []).push(el); 
						}
					});
				}
				if(id){ K.elsById[id] = el; }
				(K.elsByName[type] = K.elsByName[type] || []).push(el);
				//els.push(el);
			}

			o.events && (o.events = o.events.clone()); // Hmm... must treat input objects as immutable
			if((fn = o.click)){
				(tmp = (o.events = o.events||{})).click ? ((Array.isArray(tmp.click) ? tmp.click.push(fn) : (tmp.click = [tmp.click, fn]) )) : (tmp.click = fn);				
			}
			if(o.events){
				var scope = o.events.scope||el, fn, name, toName, to, m, events = {};
				delete o.events.scope;
				var appEvents = o.events.app;
				delete o.events.app;
				
				for(name in o.events){
					(events[name]=events[name]||[]).push({ fn: o.events[name] });
				}
				for(name in appEvents){
					(events[name]=events[name]||[]).push({ fn: appEvents[name], appEvent: true });
				}
				for(name in events){
					events[name].forEach(function(event){
						var value = event.fn,
							bindTo = event.appEvent ? Ti.App : el,
							fn;

						if( (typeof value === 'string') ){
							if(m = value.match(/^([.#]\S+)\s+(.+)$/)){
								toName = m[2];
								to = (tmp = $$(m[1])) && tmp[0]||tmp;
							} else {
								toName = value;
								to = el;
							}

							fn = functionifyEventString(toName, to);								
							bindTo.addEventListener(name, fn);
						} else {
							fn = functionifyEventString(value);
							bindTo.addEventListener(name, scope ? fn.bind(scope) : fn);
						}
					});
				}
				/*for(name in appEvents){
					fn = functionifyEventString(app[name]);
					Ti.App.addEventListener(name, scope ? fn.bind(scope) : fn);
				}*/
				
				var br = o.events.beforerender;
				br && ((typeof br === 'string') ? (el[br] && el[br]({}))||el.fireEvent(br) : br.call(el));
			}

			if(opts.silent === true){ _silent = false; }
			return el;
		};
		
		if((extra = extraCreators[t])){
			var extraType = extra.toLowerCase();
			global[extra] = K.classes[extraType] = Class.extend({
		        type: type,
		        init: defaultInit
			});
			
			K['create' + extra] = creators[extraType] = creators[type];
		}
	});

	K._wrapCustomCreator = function(creator, type){
		return function(o){		
			delete o.type;
			var obj = (new creator(o)).el;

			if(!obj._type){
				obj = K.creators[(obj.type||'view')](obj);
			};
			(K.elsByName[type]||(K.elsByName[type] = [])).push(obj);
			return obj;
		}
	}

	K.create = function(o, def){
		if(o instanceof Array){ return o.map(function(el){ return K.create(el, def); }); }
		if(o && o._type){ return o; }
		
		if(typeof o === 'string'){
			o = { type: o.toLowerCase() };
		}
		if(def && typeof def === 'object'){
			o = K.extend({}, def, o);
		}
		
		var type = o&&o.type, 
			obj;

		if(!type){
			Ti.API.log('Missing type', [o, type]);
			return K.createLabel({ text:'mtype' });
		}

		if(type && !K.creators[type]){
			//K.loadStyle(type);

			(function(){
				//Ti.API.log('requiring in creator', type);
				var creator = K.loadClass(type)||function(){ Ti.API.error(type + ' not available'); };
				K.classes[type] = creator;
				//obj = (K.creators[type] = wrapCustomCreator(creator, type))(m||o);
				obj = K._wrapCustomCreator(creator, type)(o);
			})();
		} else {
			obj = (K.creators[type])(o);
		}

		return obj.el||obj;
	};
	
})(this);

/*** AJAX ***/
(function(global){

	var noop = function(){}, 
		ajaxDefaults = {
		cache: true,
		data: {},
		error: function(){},
		defError: function(e){
			Ti.API.error(['xhr', this.opts]);
			var a = Ti.UI.createAlertDialog({
				buttonNames: ['Försök igen','Avbryt'],
				cancel: 1,
				title: 'Kommunikationsfel',
				message: "Kunde ej nå server. \nKolla din uppkoppling och försök igen!"
			});
			var xhr = this;
			a.addEventListener('click', function(e){
				if(e.index == 0){
					K.ajax(xhr.inOpts);
				}
			});
			a.show();
		},
		appcacheAge: 360000000,
		appcache: false, // TODO - set this to false!!
		timeout: 30000,
		success: noop,
		type: 'GET',
		dataType: 'json'
		};

	K.ajax = function(inOpts){
		var opts = K.extend(K.extend({}, ajaxDefaults), inOpts), 
			xhr = Ti.Network.createHTTPClient(opts), 
			data = K.extend(opts.data, opts.extendData || {}),
			loader = { _hide: function(){} },
			hash;
	
		if(opts.loader){
		
			//Ti.API.log('optsloader', K.stringify(opts.loader));
			var parent = (opts.loader._type ? opts.loader : K.currentWindow||Ti.UI.currentWindow);
			loader = parent._loader||K.createActivityIndicator({ className: 'loader' });
		
			if(!parent._loader){
			
				parent.add(loader);
				loader._show = function(){ loader.opacity = 0; loader.show(); loader.animate({ opacity: 0.7, duration: 300 }); }
				loader._hide = function(){ loader.animate({ opacity: 0, duration: 300 }, function(){ loader.hide(); }); }
				parent._loader = loader;
			}
			loader._show();
			Ti.API.log('showing loader');
		}
		xhr.inOpts = inOpts;
	
		if(!opts.url){
			loader._hide();
			return false;
		}
		 
		xhr.onload = function(){
			try {
				var response;
				switch (opts.dataType) {
					case 'json':
						var text = this.responseText;
						try {
							response = JSON.parse(text);
						}
						catch(e){
							Ti.API.error(e);
							Ti.API.error(text);
							throw "WTF?!"+e;
						}
						break;
					
					default:
						response = this.responseText;
						break;
				}

			
				opts.success && opts.success.call(opts.context || xhr, response, xhr.status, xhr);
				loader._hide();
				
				opts.complete && opts.complete(xhr, ({200:'success',304:'notmodified'})[xhr.status]||'error');
			} 
			catch (e) {
				Ti.API.error(['onload error', e]);
			}
			opts.anyway && opts.anyway();
		};
		xhr.opts = opts;
		if (!opts.silent){
			xhr.onerror = function(e){
				opts.anyway && opts.anyway();
				loader._hide();
				if( (opts.error && opts.error(e) !== false) || !opts.error){ xhr.defError(e); }
			};
		}
		xhr.requestedAt = new Date().getTime();
		xhr.open(opts.type, opts.url + (!opts.cache ? '?' + new Date().getTime() : ''));
	
		opts.beforeSend && opts.beforeSend(xhr);
		opts.contentType && xhr.setRequestHeader('Content-Type', opts.contentType);
		var name;
		if(opts.headers){
			for(name in opts.headers){
				xhr.setRequestHeader(name, opts.headers[name]);
			}
		}
		xhr.send(data);
		return xhr;
	};

	K.ajaxSetup = function(opts){ K.merge(ajaxDefaults, opts); };

	var yqlStart = 'http://query.yahooapis.com/v1/public/yql',
		yqlEnd = '&format=json&callback=';
		
	K.yql = function(opts){
		opts.url = yqlStart;
		opts.data = ('format=json&callback=&diagnostics=true&q=' + opts.q).esc(opts.params, encodeURIComponent).toString();
		opts.type = 'POST';
		opts.headers = {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
		};
		return K.ajax(opts);
	};

})(this);

/*** LIVE ***/
(function(global) {

	K.reset = function() {
		K.elsByClassName = {};
		K.elsById = {};
		K.elsByName = {};
		uuid = win._uuid = 1;
	};
	K.reset();

	function cleanse(s) {
		return (s || '').replace(/[<>&]/g, function(m) {
			return {
				'&': '&amp;',
				'>': '&gt;',
				'<': '&lt;'
			} [m];
		});
	}

	var Framer = function(delimiter) {
		this.delimiter = delimiter ? delimiter : "\0";
		this.buffer = [];
	};

	Framer.prototype.next = function(data) {
		var frames = data.split(this.delimiter, -1);
		this.buffer.push(frames.shift());
		if (frames.length > 0) {
			frames.unshift(this.buffer.join(''));
			this.buffer.length = 0;
			this.buffer.push(frames.pop());
		}
		return frames;
	};

	var framer = new Framer("ZOMG" + "KRAWALLERROCKS");

	/**
	 * Start watching for file changes to be piped from nodejs server
	 * @param host Host for server
	 * @param port Port for server. Default is 8128
	 * @param win Window to add 'close' listener to for cleaning up socket
	 */
	Ti.App.Properties.setBool('_watching', false);
	K.watch = function(host, port) {
		K.log('starting livetanium');
		// Only open one connection, preferrably from app.js
		if (Ti.App.Properties.getBool('_watching')) {
			return false;
		}
		Ti.App.Properties.setBool('_watching', true);

		var watchers = {},
			Watcher = {
			watch: function(file, callback, e) {
				if (!watchers[file]) {
					socket.write(JSON.stringify({
						action: 'watch',
						file: file
					}));
					watchers[file] = e.source;
				}
			}
		};

		var socket = Titanium.Network.createTCPSocket({
			hostName: host,
			port: port,
			mode: Titanium.Network.READ_WRITE_MODE
		});

		function parseFrame(frame) {
			try {
				var o = JSON.parse(frame);

				switch (o.action) {
					case 'cmd':
						var res;
						try {
							res = eval('(' + o.cmd + ')');
						} catch(e) {
							res = e;
						}
						socket.write(JSON.stringify({
							action: 'res',
							res: cleanse(K.stringify(res)).replace(/[\u007F-\uFFFF]/g, function(a){ return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4) })
						}));
						break;

					case 'filechange':
						// Upon filechange, call all applicable listening contexts
						Ti.App.fireEvent('filechange', { name: o.file });
						try {
							var name = o.file.replace(/^\.?\//, function($0) {
								return '';
							}).replace(/\//g, '-'),
								path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
								h = Ti.Filesystem.getFile(path, name);

							h.write(o.content);
						} catch(e) {
							Ti.API.error(e);
						}

						var m = o.file.match(/[^.]+$/); // Get file extension
						switch (m && m[0]) {
							case 'kss':
							case 'jss':
								K.log('Applying live styles from: "' + o.file + '"');
								
								K.style(null, o.content, true);
								
								/*var tree = K.buildSelectorTree(o.content);
								tree.forEach(function(rule) {
									//Ti.API.log('procel', [rule.selector, K(rule.selector)]);
									K(rule.selector).each(function() {
										var el = this;
										//Ti.API.log('el', el); 
										rule.properties.forEach(function(o) {
											el[o.property] = o.value;
										});
									});
								});*/
								break;

							case 'js':
								if (/kui\//.test(o.file)) {
									var req = eval('try { var exports = {}; ' + o.content + '; exports.Class; } catch(e){ Ti.API.error(e); }'),
										type;
									
									K.log('Trying to live update "'+o.file+'". If this explodes, run "kranium watch --nolivejs" instead')
									if (req && (type = (o.file.match(/([^\/]+)\.js$/) || [false, false])[1])) {
										var klass = K.classes[type] = K.loadClass(type, req);
										K('.' + type).each(function() {
											//Ti.API.log('oldprops', this._props);
											
											var old = this,
												index,
												n = new klass(old._props).el;

											if (n._type == 'window') {
												K(old.children).each(function() {
													K(this).remove();
												});

												/*if ((index = K.elsByName[old._type].indexOf(old)) != -1) {
													K.elsByName[old._type].splice(index, 1);
												}*/

												var $old = K(old);
												K(n.children).each(function() {
													$old.append(this);
												});
												//Ti.API.log('children', n.children);
											} else {
												var parent = old.getParent();
												K(old).remove();
												
												/*if ((index = K.elsByName[old._type].indexOf(old)) != -1) {
													K.elsByName[old._type].splice(index, 1);
												}*/

												K(parent).append(n);
											}
											//Ti.API.log('n', n);
										});
									}
								}
							break;
						}
						break;

					case 'files':
						// Write all files to app tmp directory on startup
						Ti.API.info('Socket connected - receiving files');
						o.files.forEach(function(f, i) {
							var name = f.name.replace(/\.\//, function($0) {
								return '';
							}).replace(/\//g, '-'),
								path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
								h = Ti.Filesystem.getFile(path, name);

							h.write(f.content);
						});
						break;

					case 'message':
						Ti.API.info('Socket message', o.message);
						break;
				}
			} catch(e) {
				Ti.API.error(e);
			}
		}

		socket.addEventListener('read', function(e) {
			//Ti.API.log('inserting into frame', e.data.text);
			framer.next(e.data.text).forEach(parseFrame);
		});
		
		socket.addEventListener('close', function(e) {
			K.log('socket closed');
		});

		Ti.App.addEventListener('close', function(e) {
			if (socket.isValid) {
				Ti.API.log('close socket');
				socket.close();
			}
		});

		socket.connect();
		socket.write(JSON.stringify({
			action: 'echo',
			message: 'Socket connected'
		}));
		
		global.socketwrite = function(msg, type){ socket.write(JSON.stringify({ action: type, msg: msg })); };
		global.customsocketwrite = function(o){ if(!o.action){ return; } socket.write(JSON.stringify(o)); };
		
		var log = K.log;
		K.log = function(){
			var args = Array.prototype.slice.call(arguments);
			log.apply(log, args);
			try {
				socket.write(JSON.stringify({
					action: 'res',
					res: cleanse(K.stringify(args.length === 1 ? args[0] : args))
				}));
			} catch(e){ Ti.API.error(e); }
		};
	};

})(this);


/*** STRINGIFY ***/
(function(global){
	var reTiObject = /^\[object Ti/;
	// From jsconsole by @rem
	function sortci(a, b) {
	  return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
	}

	function stringify(o, simple) {
	  var json = '', i, type = ({}).toString.call(o), parts = [], names = [], ownType = o && o.toString && o.toString();
  
	  if (type == '[object String]') {
	    json = '"' + o.replace(/"/g, '\\"') + '"';
	  } else if (type == '[object Array]') {
	    json = '[';
	    for (i = 0; i < o.length; i++) {
	      parts.push(stringify(o[i], simple));
	    }
	    json += parts.join(', ') + ']';
	    json;
	  } else if (o === null) {
	    json = 'null';
	  } else if (o === undefined) {
	    json = 'undefined';
	  } else if (ownType && reTiObject.test(ownType)) {
		json += [
			'"',
			"<",
			(o._type||'unknown'),
			(o._id ? " id='"+o._id+"'" : ""),
			o.className ? " class='"+o.className+"'" : "",
			">",
			((tmp = (o.text||o.title||""))? tmp :''),
			"</" + (o._type||'unknown') + ">",
			'"'
		].join("");
	  } else if (type == '[object Object]') {
	    json = '{';
	    for (i in o) {
	      names.push(i);
	    }
	    names.sort(sortci);
	    for (i = 0; i < names.length; i++) {
	      parts.push(stringify(names[i]) + ': ' + stringify(o[names[i] ], simple));
	    }
	    json += parts.join(', ') + '}';
	  } else if (type == '[object Number]') {
	    json = o+'';
	  } else if (type == '[object Boolean]') {
	    json = o ? 'true' : 'false';
	  } else if (type == '[object Function]') {
	    json = o.toString();
	  } else if (simple == undefined) {
	    json = type + '{\n';
	    for (i in o) {
	      names.push(i);
	    }
	    names.sort(sortci);
	    for (i = 0; i < names.length; i++) {
	      parts.push(names[i] + ': ' + stringify(o[names[i]], true)); // safety from max stack
	    }
	    json += parts.join(',\n') + '\n}';
	  } else {
	    try {
	      json = o+''; // should look like an object      
	    } catch (e) {}
	  }
	  return json;
	}
	K.stringify = stringify;

})(this);

/*** END ***/
(function(global){
	Ti.include('/kranium/kranium-generated-bootstrap.js');
})(this);


/*** TESTER ***/
(function(global){
	if(global.TEST){
		K.log('Testing activated! :-O');
		Ti.App.addEventListener('filechange', test);

		Ti.include('/kranium/lib/test/jasmine-1.0.2.js');
		Ti.include('/kranium/lib/test/jasmine-titanium-node.js');

		function test(){
			jasmine.currentEnv_ = null;
			jasmine.getEnv().addReporter(new jasmine.TitaniumNodeReporter());

			win = Ti.UI.createWindow({ width: 100, height: 100, backgroundColor: '#ccc', left: -200, opacity: 0.8 });
			win.open();
			Ti.App.addEventListener('filechange', function(){ win.close(); });

			q = function(str){
				return (Array.prototype.slice.call(arguments).join(", ")).split(/\s+,\s+/g).map(function(id){ return getElementById(id); });
			};

			// Include all the test files
			//Ti.include('/test/demo.js');
			
			var testDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'test');
			testDir.getDirectoryListing().forEach(function(file){
				if(file !== 'lib'){
					Ti.include('/test/' + file);
				}
			});
			
			
			jasmine.getEnv().execute();
		}
		test();
	}
})(this);