/*** LICENSE ***/
/*!
 * Kranium
 * Copyright (c) 2011 Jacob Waller <jacob@krawaller.se>
 * Copyright (c) 2011 David Waller <david@krawaller.se>
 * MIT Licensed
 * 
 * Portions of the copyright belongs to the following entities
 * Simple JavaScript Inheritance (c) 2008 John Resig 
 * "mini" Selector Engine (c) 2009 James Padolsey
 * Jade (c) 2009-2010 TJ Holowaychuk <tj@vision-media.ca>
 * Jasmine (c) 2008-2011 Pivotal Labs
 * Zepto (c) 2010, 2011 Thomas Fuchs
 * JSConsole (c) 2010 Remy Sharp, http://jsconsole.com
 * selectivizr v1.0.0 - (c) Keith Clark
 * Flexie (c) 2010 Richard Herrera
 * changeColor (c) 2010 eyelidlessness
 * TitaniumReporter (c) 2011 Guilherme Chapiewski
 */



/*** VERSION ***/
KRANIUM_VERSION = "0.1.4";

/*** CORE ***/
/*!
The core module of Kranium is heavily based on Zepto, which has the following license:

Copyright (c) 2010, 2011 Thomas Fuchs
http://zeptojs.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Define core module
 */

(function(global){

global.GLOBAL = global;
win = global.win||Ti.UI.currentWindow||{};

/**
 * Cache RegExps
 */
var reTiObject = /^(\[object Ti|\[Ti\.)/,
	reJadeStr = /(\.jade$|^\s*<)/,
	
	/**
	 * Inline utility functions
	 */	
	ArrayProp = Array.prototype,
	slice = ArrayProp.slice, 
	toString = Object.prototype.toString,
	noop = function(){};

	/**
	 * Create class-checking function
	 *
	 * @param {String} name className
	 * @returns {Function} Function testing if arg has class
	 */
	function classRE(name){ return new RegExp("(^|\\s)" + name + "(\\s|$)"); }
	
	/**
	 * Filter falsy values from array
	 *
	 * @param {Array} array
	 * @returns {Array} clone of array with falsy values filtered out
	 */
	function compact(array){ return array.filter(function(item){ return item !== undefined && item !== null; }); }
	
	/**
	 * Flatten array of arrays
	 *
	 * @param {Array} array
	 * @returns {Array} Shallow clone of array
	 */
	function flatten(array){ return array.reduce(function(a,b){ return a.concat(b); }, []); }
	
	/**
	 * Camel-case dash-separated string
	 *
	 * @param {String} str
	 * @returns {String} Camel-cased input str
	 */
	function camelize(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : ''; }); }
	
	/**
	 * Arrayify input
	 *
	 * @param {Object} o
	 * @returns {Array} If input was array, return it, otherwise wrap input in new array
	 */
	function arrayify(o){ return o == null ? [] : (Array.isArray(o) ? o : [o]); }

	function refreshStyle(el){
		var _opts = el._opts,
			styles = K.getStyle(el, _opts && _opts.type, _opts && _opts._type);
			
		for(var prop in styles){
			el[prop] = styles[prop];
		}
	}

	/**
	 * Kranium object constructory-thingy
	 *
	 * @param {Array} dom
	 * @param {String} selector
	 * @returns {Z} Kranium collection
	 */
	function Z(dom, selector) {
		dom = dom||[];
		dom.__proto__ = Z.prototype;
		dom.selector = selector||'';
		return dom;
	}
	
	/**
	 * Kranium object creator
	 *
	 * @param {String|Array|TiObject|Object} dom
	 * @param {String|Array|TiObject|Object} context
	 * @returns {Z} Kranium collection
	 */
	var $ = function(selector, context){
		if (context !== undefined) return $(context).find(selector);
		else if (selector instanceof Z) return selector;
		else {
			var dom, tmp;
			if (typeof selector === 'undefined' || selector === null || selector === '#' || selector === '') dom = [];
			//else if (typeof selector === 'string' && /\.jade/)
			else if (Array.isArray(selector)){ dom = K.create(selector); }
			else if (selector && selector.toString && reTiObject.test(selector.toString())) dom = [selector];
			else if (
				toString.call(selector) == '[object Object]' || 
				(typeof selector === 'string' && reJadeStr.test(selector) )
			) dom = [K.create(selector)];
			else dom = Array.isArray((tmp = $$(selector, null))) ? tmp : [tmp];			
			return Z(dom, selector);
		}
	};


	/**
	 * Utility methods
	 */
	var block;
	$.fn = {
		forEach: ArrayProp.forEach,
		map: ArrayProp.map,
		reduce: ArrayProp.reduce,
		push: ArrayProp.push,
		indexOf: ArrayProp.indexOf,
		concat: ArrayProp.concat,
		
		/**
		 * Get plain array from Kranium collection
		 *
		 * @param {Integer} [idx] Return only element at index
		 * @returns {Z} Kranium collection
		 */
		get: function(idx){ 
			return idx === undefined ? 
				slice.call(this) : 
				(idx < 0 ? this[this.length + idx] : this[idx]); 
		},
		
		/**
		 * Set properties on all elements in Kranium collection
		 *
		 * @param {String|Object} [prop] Prop to set value to, or Object containg key-value-pairs
		 * @param {String} [val] Value to set prop to
		 * @returns {Z} Kranium collection
		 */
		set: function(prop, val){
			var props = (typeof prop === 'string') ? 
					[{ key: prop, val: val }] : 
					Object.keys(prop).map(function(key){ 
						return { key: key, val: prop[key] }; 	
					}),
					
				i, o;
			return this.each(function(){
				i = props.length;
				while((o = props[--i])){
					this[o.key] = o.val;
				}
			});
		},
		
		/**
		 * Run function on all elements in Kranium collection
		 *
		 * @param {String} [prop] Name of func to call
		 * @param {Object} [val] Value to send to func
		 * @returns {Z} Kranium collection
		 */
		go: function(prop, val){
			return this.each(function(){
				if(typeof this[prop] === 'function'){
					this[prop](val);
				}
			});
		},
		
		/**
		 * Select part of collection
		 *
		 * @param {Integer} start Starting position
		 * @param {Integer} end Ending position
		 * @returns {Z} Kranium collection
		 */
		slice: function(start, end){			
			return K(slice.call(this, start, end === 0 ? undefined : end));
		},
		
		/**
		 * Turn Kranium collection into plain Array
		 *
		 * @returns {Array}
		 */
		toArray: function(){ return slice.call(this); },
		
		/**
		 * Get number of elements in collection
		 *
		 * @returns {Integer}
		 */
		size: function(){ return this.length; },
		
		/**
		 * Remove the elements in the collection from their respective parents
		 *
		 * @returns {Z} Kranium collection
		 */
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
		
		/**
		 * Iterate collection using iterator
		 *
		 * @param {Function} callback
		 * @returns {Z} Kranium collection
		 */
		each: function(callback){
			this.forEach(function(el, idx){ callback.call(el, idx, el); });
			return this;
		},
		
		/**
		 * Filter collection using selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
		filter: function(selector){
			return $(ArrayProp.filter.call(this, function(element){
				return $$(selector, element.getParent()).indexOf(element) >= 0;
			}));
		},
		
		/**
		 * Test if first element in collection matches selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
		is: function(selector){
			return this.length > 0 && $(this[0]).filter(selector).length > 0;
		},
		
		/**
		 * Pick element from collection
		 *
		 * @param {Integer} idx
		 * @returns {Z} Kranium collection
		 */
		eq: function(idx){ idx = parseInt(idx, 10); return $(this).slice(idx, idx + 1); },
		
		/**
		 * Add stuff to a clone of the current collection
		 *
		 * @param {Array|TiObject|KraniumCollection} els
		 * @returns {Z} Kranium collection
		 */
		add: function(els){
			return $(this.concat(Array.isArray(els) ? els : [els]));
		},
		
		/**
		 * Get first element in collection
		 *
		 * @returns {Z} Kranium collection
		 */
		first: function(){ return $(this[0]); },
		
		/**
		 * Get last element in collection
		 *
		 * @returns {Z} Kranium collection
		 */
		last: function(){ return $(this[this.length - 1]); },
		
		/**
		 * Search first element for elements matching selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
		find: function(selector){
			var result;
			if (this.length == 1) result = $$(selector, this[0]);
			else result = flatten(this.map(function(el){ return $$(selector, el); }));
			return $(result);
		},
		
		/**
		 * Find the first ancestor matching the selector
		 *
		 * @param {String} selector
		 * @param {String|TiObject} context
		 * @returns {Z} Kranium collection
		 */
		closest: function(selector, context){
			var node = this[0],
				nodes = $$(selector, context); //context !== undefined ? context : document);
			
			if (nodes.length === 0) node = null;
			while (node && nodes.indexOf(node) < 0) { node = node.getParent(); };
			return $(node);

		},
		parents: function(){}, //TODO: implement me
		
		/**
		 * For all elements in the collection, return their parent, optionally only if it matches the selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
		parent: function(selector){
			var node, nodes = [];
			this.each(function(){
				if ((node = this.getParent()) && nodes.indexOf(node) < 0) nodes.push(node);
			});
			nodes = $(nodes);
			return selector === undefined ? nodes : nodes.filter(selector);
		},
		
		/**
		 * For all elements in the collection, return their children, optionally only if it matches the selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
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
		
		/**
		 * Pluck property from elements in collection
		 *
		 * @param {String} property
		 * @returns {Z} Kranium collection
		 */
		pluck: function(property){ return this.map(function(element){ return element[property]; }); },
		
		/**
		 * Show elements in collection
		 *
		 * @returns {Z} Kranium collection
		 */
		show: function(o){ return this.each(function(){ this.show(o); }); },
		
		/**
		 * Hide elements in collection
		 *
		 * @returns {Z} Kranium collection
		 */
		hide: function(){ return this.each(function(){ this.hide(); }); },
		
		focus: function(){ return this.each(function(){ this.focus(); }); },
		blur: function(){ return this.each(function(){ this.blur(); }); },
		
		prev: function(){}, //TODO: implement me
		next: function(){}, //TODO: implement me
		
		/**
		 * Get value of first element or set value of all elements in collection
		 *
		 * @param {Any} [val] If specified, set value of all elements, otherwise return current value of first element
		 * @returns {Z} Kranium collection
		 */
		val: function(val){
			return val === undefined ? (this.length > 0 ? this[0].value : null) : this.each(function() {
				this.value = val;
			});
		},
		
		offset: function(){}, //TODO: implement me
		
		/**
		 * Get css property of first element or set css property of all elements in collection
		 *
		 * @param {String|Object} property Property to get or set value for, or hash map to set
		 * @param {String|Integer} [value] If specified, set css of elements, otherwise return current value of first element
		 * @returns {Z} Kranium collection
		 */
		css: function(property, value) {
			if (value === undefined && typeof property == 'string') return this[0] && this[0][camelize(property)];
			if(typeof property == 'string' && typeof value != 'undefined'){
				var p = property;
				property = {};
				property[camelize(p)] = value;
			}
			return this.each(function() {
				for (key in property){
					this[key] = property[key];
				}
			});
		},
		
		/**
		 * Get index of element in collection
		 *
		 * @param {TiObject} element
		 * @returns {Integer} Position in collection
		 */
		index: function(element){
			return this.indexOf($(element)[0]);
		},
		
		/**
		 * Test if first element in collection has the specified class
		 *
		 * @param {String} name
		 * @returns {Boolean}
		 */
		hasClass: function(name){
			return classRE(name).test(this[0].className);
		},
		
		/**
		 * Add class to all elements in collection
		 *
		 * @param {String} name
		 * @returns {Boolean}
		 */
		addClass: function(name){
			if(typeof name === 'string'){
				return this.each(function(){
					!$(this).hasClass(name) && (this.className += (this.className ? ' ' : '') + name);
					refreshStyle(this);
				});
			}
		},
		
		/**
		 * Rmove class from all elements in collection
		 *
		 * @param {String} name
		 * @returns {Boolean}
		 */
		removeClass: function(name){
			if(typeof name === 'string'){
				return this.each(function(){
					this.className = this.className.replace(classRE(name), ' ').trim();
					refreshStyle(this);
				});
			}
		},
		
		/**
		 * Toggle class for all elements in collection
		 *
		 * @param {String} name
		 * @param {Boolean} [when]
		 * @returns {Boolean}
		 */
		toggleClass: function(name, when){
			if(typeof name === 'string'){
				return this.each(function(){
				 	((when !== undefined && !when) || $(this).hasClass(name)) ?
				 	$(this).removeClass(name) : $(this).addClass(name);
				
					refreshStyle(this);
				});
			}
		},
		
		/**
		 * Append elements to first element in collection
		 *
		 * @param {Array|TiObject} els
		 * @returns {Z} Kranium collection
		 */
		append: function(els){
			var parent = this[0],
				els = arrayify(els);
				
			if(parent){
				switch(parent){
					default:
						els.forEach(function(el){
							el = K.create(el);
							parent.add(el); 	
						});
						break;
				}
			}
			
			return this;
		},
		
		/**
		 * Append all elements to specified parent
		 *
		 * @param {Array|TiObject|Collection} parent
		 * @returns {Z} Kranium collection
		 */
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
		
		/**
		 * Bind namd event listener to all elements in collection with optional context
		 *
		 * @param {String} name
		 * @param {Function} fn
		 * @param {Any} ctx
		 * @returns {Z} Kranium collection
		 */
		bind: function(name, fn, ctx){
			return this.each(function(){
				var el = this,
					events = (el._events = el._events||{}),
					boundFn = fn.bind(ctx || el);
					
				(events[name] = events[name]||[]).push(boundFn);
				
				el.addEventListener(name, boundFn);
			});
		},
		
		/**
		 * Unbind namd event listener from all elements in collection
		 *
		 * @param {String} name
		 * @returns {Z} Kranium collection
		 */
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
		
		/**
		 * Open first element in collection
		 *
		 * @param {TiObject} parent
		 * @param {Object} o Options object to pass to open fn
		 * @param {Any} ctx
		 * @returns {Z} Kranium collection
		 */
		open: function(parent, o){
			var el = this[0];

			if(typeof parent === 'string'){
				parent = $$(parent)[0] || null;
			}

			if(el){
				switch(el._type){
					case 'window':
						if(parent == 'tab'){
							if(block){ return; } else { block = true; }

							el.addEventListener('open', function(){ block = false; });
							K.currentWindow = el;

							var tab = (
								(tmp = ((o&&o.tab)||o)) &&
								(typeof tmp === 'string') ? $$(tmp)[0] : tmp
							) || (
								(tmp = $$('tabgroup')) && tmp[0] && tmp[0].activeTab
							);

							(tab||Ti.UI.currentTab).open(el, o||{});
						} else if(parent && parent._type && ['navigationgroup', 'tabgroup', 'tab'].indexOf(parent._type) !== -1) {
							if(parent._type === 'tabgroup'){
								parent = parent.activeTab;
							}	
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
		
		/**
		 * Close first element in collection
		 *
		 * @returns {Z} Kranium collection
		 */
		close: function(){
			var el = this[0];
			el && el.close && el.close();
			return this;
		},
		
		/**
		 * Get text of first element or set text of all elements in collection
		 *
		 * @param {String} [text] If specified, set text of elements, otherwise return current text of first element
		 * @returns {Z} Kranium collection
		 */
		text: function(text) {
			return text === undefined ? (this.length > 0 ? (this[0].text||this[0].title) : null) : this.each(function() {
				this.text = this.title = text;
			});
		},
		
		/**
		 * Animate every element in the collection with the specified options and callback
		 *
		 * @param {Object} opts
		 * @param {Function} [cb]
		 * @returns {Z} Kranium collection
		 */
		animate: function(opts, cb){
			return this.each(function(i){
				this.animate(opts, (i == 0 ? cb||noop : noop));
			});
		},
		
		/**
		 * Trigger the passed event for every element in the collection with optional options object
		 *
		 * @param {String} event
		 * @param {Object} [obj]
		 * @returns {Z} Kranium collection
		 */
		trigger: function(event, obj){
			return this.each(function(i){
				this.fireEvent(event, obj);
			});
		},
		
		/**
		 * Replace every element in collection with passed el
		 *
		 * @param {TiObject|Object} el
		 * @returns {Z} Kranium collection
		 */
		replaceWith: function(el){
			var $parent;
			return this.each(function(i){
				K(this).children().remove();
				this.add(K.create(el));
			});
		},
		
		/**
		 * Return stringified representation of collection
		 *
		 * @returns {String} Stringified representation of collection
		 */
		stringify: function(){
			return K.stringify(this);
		}

	};
	
	/**
	 * Iterator
	 *
	 * @param {Array|Collection} obj
	 * @param {Function} iterator
	 */
	$.each = function(obj, iterator){
		(obj||[]).forEach(function(el){
			iterator.call(el, el);
		});
	}

	/**
	 * Set utility methods to Z prototype to expose to collections
	 */
	Z.prototype = $.fn;
	
	/**
	 * Expose Kranium to global variables
	 */
	global.$ = global.K = global.jQuery = global.Zepto = $;
	
	/**
	 * Expose Kranium-Jade to global variable
	 */
	global.J = function(jadeStr, o){
		return K(K.jade(jadeStr, o));
	};
	
	/**
	 * Cache platform
	 */
	var platform = Ti.Platform.osname;
	
	/**
	 * Basic feature detection
	 */
	$.is = {
		android: platform === 'android',
		iphone: platform === 'iphone',
		ipad: platform === 'ipad',
		ios: platform === 'iphone' || platform === 'ipad'
	};
	
	/*
	 * Expose core utility functions
	 */
	K.compact = compact;
	K.flatten = flatten;
	K.camelize = camelize;
	K.arrayify = arrayify;
	
})(this);




/*** EVENT ***/
(function($){
  var $$ = $.qsa, handlers = {}, _zid = 1;
  function zid(element) {
    return element._zid || (element._zid = _zid++);
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) var matcher = matcherFor(event.ns);
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || handler.fn == fn)
        && (!selector || handler.sel == selector);
    });
  }
  function parse(event) {
    var parts = ('' + event).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')};
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
  }

  function add(element, events, fn, selector, delegate){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []));
    events.split(/\s/).forEach(function(event){
      var callback = delegate || fn;
      //var proxyfn = function(event) { return callback(event, event.data) };
      var proxyfn = function(event) { return callback.call(element, event, event.data) };
      var handler = $.extend(parse(event), {fn: fn, proxy: proxyfn, sel: selector, del: delegate, i: set.length});
      set.push(handler);
      element.addEventListener(handler.e, proxyfn, false);
    });
  }
  function remove(element, events, fn, selector){
    var id = zid(element);
    (events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i];
        element.removeEventListener(handler.e, handler.proxy, false);
      });
    });
  }

  $.event = { add: add, remove: remove }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback);
    });
  };
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback);
    });
  };
  $.fn.one = function(event, callback){
    return this.each(function(){
      var self = this;
      //add(this, event, function wrapper(wrapperEventObject){
      add(this, event, function wrapper(wrapperEventObject){
        //callback();
        callback.call(this, wrapperEventObject, wrapperEventObject && wrapperEventObject.data)
        remove(self, event, arguments.callee);
      });
    });
  };

  var eventMethods = ['preventDefault', 'stopImmediatePropagation', 'stopPropagation'];
  function createProxy(event) {
    var proxy = $.extend({originalEvent: event}, event);
    eventMethods.forEach(function(key) {
      proxy[key] = function() {return event[key].apply(event, arguments)};
    });
    return proxy;
  }

  /*$.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(e, data){
        var target = e.target, nodes = $$(element, selector);
        while (target && nodes.indexOf(target) < 0) target = target.parentNode;
        if (target && !(target === element) && !(target === document)) {
          callback.call(target, $.extend(createProxy(e), {
            currentTarget: target, liveFired: element
          }), data);
        }
      });
    });
  };
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector);
    });
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback);
    return this;
  };
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback);
    return this;
  };

  $.fn.trigger = function(event, data){
    return this.each(function(){
      var e = document.createEvent('Events');
      e.initEvent(event, true, true)
      e.data = data;
      this.dispatchEvent(e);
    });
  };*/
})(Zepto);

/*** SETTINGS ***/
(function(){
	
	K.settings = {
		useCustomAndroidNavBar: K.is.android
	};
	
})();

/*** UTILS ***/
/**
 * Define utils
 */

//(function(global){

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

K.get = function(key){ var str = Ti.App.Properties.getString(key); return str != null ? JSON.parse(str) : null; };
K.set = function(key, val){ return Ti.App.Properties.setString(key, JSON.stringify(val)); };

K.alert = function(message, title){
	Ti.UI.createAlertDialog({
        title: title || 'Obs!',
        message: message
    }).show();
};

var android = Ti.Platform.osname === 'android';
K.log = function(a, b){
	var out = (b ? Array.prototype.slice.call(arguments) : a);
	Ti.API.log("Kranium", android ? JSON.stringify(out) : out);
};

K.pad = function(num, totalChars) {
    var pad = '0';
    num = num + '';
    while (num.length < totalChars) {
        num = pad + num;
    }
    return num;
};


/*!
 * changeColor (c) 2010 eyelidlessness
 */
K.changeColor = function(color, ratio, darker) {
    // Trim trailing/leading whitespace
    color = color.replace(/^\s*|\s*$/, '');

    // Expand three-digit hex
    color = color.replace(
        /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i,
        '#$1$1$2$2$3$3'
    );

    // Calculate ratio
    var difference = Math.round(ratio * 256) * (darker ? -1 : 1),
        // Determine if input is RGB(A)
        rgb = color.match(new RegExp('^rgba?\\(\\s*' +
            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
            '\\s*,\\s*' +
            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
            '\\s*,\\s*' +
            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
            '(?:\\s*,\\s*' +
            '(0|1|0?\\.\\d+))?' +
            '\\s*\\)$'
        , 'i')),
        alpha = !!rgb && rgb[4] != null ? rgb[4] : null,

        // Convert hex to decimal
        decimal = !!rgb? [rgb[1], rgb[2], rgb[3]] : color.replace(
            /^#?([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])/i,
            function() {
                return parseInt(arguments[1], 16) + ',' +
                    parseInt(arguments[2], 16) + ',' +
                    parseInt(arguments[3], 16);
            }
        ).split(/,/),
        returnValue;

    // Return RGB(A)
    return !!rgb ?
        'rgb' + (alpha !== null ? 'a' : '') + '(' +
            Math[darker ? 'max' : 'min'](
                parseInt(decimal[0], 10) + difference, darker ? 0 : 255
            ) + ', ' +
            Math[darker ? 'max' : 'min'](
                parseInt(decimal[1], 10) + difference, darker ? 0 : 255
            ) + ', ' +
            Math[darker ? 'max' : 'min'](
                parseInt(decimal[2], 10) + difference, darker ? 0 : 255
            ) +
            (alpha !== null ? ', ' + alpha : '') +
            ')' :
        // Return hex
        [
            '#',
            K.pad(Math[darker ? 'max' : 'min'](
                parseInt(decimal[0], 10) + difference, darker ? 0 : 255
            ).toString(16), 2),
            K.pad(Math[darker ? 'max' : 'min'](
                parseInt(decimal[1], 10) + difference, darker ? 0 : 255
            ).toString(16), 2),
            K.pad(Math[darker ? 'max' : 'min'](
                parseInt(decimal[2], 10) + difference, darker ? 0 : 255
            ).toString(16), 2)
        ].join('');
};

var androidIndicator;
K.loadify = function(el, fn, msg, modal){
	var done;
	if(K.is.ios){
		var p = (el && el._p) || el || GLOBAL.win || Ti.UI.currentWindow;

		if(!p){ return; }

		if(modal){
			p = el._p = K.isTiObject(el) ? el : K(typeof el === 'string' ? el : 'tabgroup').get(0);
		} 

		if(p && !p._loader){
			p._loader = K.createActivityIndicator({
				className: (modal ? 'modalLoader' : 'loader') + ' ' + (modal ? 'modalLoader' : 'loader') + (p._type === 'tabgroup' ? 'TabGroup' : 'Window'),
				//message: modal ? msg : '',
				//width: 'auto'
			});

			p && p.add(p._loader);
			p._loader.message = msg;
	        p._loader.show();
	        p._loader.message = null;
	        p._loader.hide();
		}

		p._loader.message = msg || null;
		p._loader.show();

	} else {
		androidIndicator = androidIndicator || Titanium.UI.createActivityIndicator();
		androidIndicator.message = msg;
		androidIndicator.show();
	}

	if(fn){ // Test if func
		done = function(){ K.doneify(el); };
		if(typeof fn(done) !== 'undefined'){
			done();
		}
	}
};

K.doneify = function(el){
	if(K.is.ios){
		var p = (el && el._p) || (el && el._type && el) || (K(typeof el === 'string' ? el : 'tabgroup').get(0)) || GLOBAL.win || Ti.UI.currentWindow;
		p && p._loader && setTimeout(p._loader.hide, 500);
	} else {
		androidIndicator.hide();
	}
};

K.parseJSON = JSON.parse;


// Notification popups
(function(){

	function show(){
		messageView.opacity = 0;
		messageView.show();
		messageView.animate({ opacity: 0.95, duration: 500 });
	}

	function hide(){
		messageView.animate({ opacity: 0, duration: 500 }, function(){
			messageView.hide();
		});
	}

	var messageLabel, messageView;
	K.notify = function(msg){
		if(K.is.ios){
			if(!messageLabel){
				messageLabel = K.createLabel({
					className: 'notificationLabel',
					text: msg
				});
			}

			if(!messageView){
				messageView = K.createView({
					className: 'notification',
					visible: false,
					children: [{
						type: 'view',
						className: 'notificationBody',
						children: [messageLabel]
					},
					{
						type: 'view',
						className: 'notificationShadow'
					}],
					click: hide
				});

				K('tabgroup').append(messageView);
			}

			messageView.height = Math.ceil(msg.length/32) * 20 + 20;
			messageLabel.text = msg;
			show();

			setTimeout(hide, 5000);
		} else {
			Ti.UI.createNotification({
				message: msg,
				duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
				offsetX: 0,
				offsetY: 30
			}).show();
		}
	
	};

})();

// Enhanced localization
(function(){
	var cache = {};
	K.l = function(key, hint, obj, modifier){
		if(cache[key]){
			return cache[key];
		}
		
		modifier = modifier || function(s){ return s; };
		if(typeof hint === 'object'){
			obj = hint;
			hint = null;
		}
	
		var doCache = true,
			ret = ((Titanium.Locale.getString(key, hint || key) || '').replace(/(^|[^\w\d])@([A-Za-z_\-]+)\b/g, function($0, $1, name){
				doCache = false;
				return ($1||'')+modifier(obj && typeof obj[name] !== 'undefined' ? obj[name] : Titanium.Locale.getString(name));
			}));
			
		if(doCache){
			cache[key] = ret;
		}
	
		return ret;
	};
})();




function singleExtend(destination, source){
	var property;
	if(!destination){ return source; }
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

function arrayify() {
    return Array.isArray(this) ? this : [this];
}

/*if(!Object.prototype.arrayify){
	Object.defineProperty(Object.prototype, "arrayify", {
	    enumerable: false,
	    value: function() {
	        return Array.isArray(this) ? this : [this];
	    }
	});
}*/

if(!Function.prototype.defer){
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

Array.prototype.pluck = function(prop){
	return this.map(function(o){ return o[prop]; });
};

/*
 * Bind a function to a context
 * @param ctx Context to run the function in
 * @return Function applying new scope to original function
 */
var slice = Array.prototype.slice;
Function.prototype.bind = function(ctx){ 
	var fn = this;
	return function(){ 
		return fn.apply(ctx || fn, slice.call(arguments)); 
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

String.prototype.esc = function(obj, func, matcher){
	
	if(func instanceof RegExp){
		matcher = func;
		func = null;
	}
	
	if(typeof obj === 'function'){
		func = obj;
		obj = {};
	}
	
    return this.replace(matcher || /#\{([A-Za-z_]+)\}/g, function($0, $1){
        return typeof obj[$1] != "undefined" ? (func ? func(obj[$1]) : obj[$1]) : (func ? func($1)||$0 : $0);
    });
};


(function(){
	
	var hasOwn = Object.prototype.hasOwnProperty,

		// [[Class]] -> type pairs
		class2type = {};
		
	"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name, i) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	});
	
	var jQuery = {
		
		fn: {},
		isWindow: function( obj ) {
			return obj && typeof obj === "object" && "setInterval" in obj;
		},
		
		isFunction: function( obj ) {
			return jQuery.type(obj) === "function";
		},

		isArray: Array.isArray || function( obj ) {
			return jQuery.type(obj) === "array";
		},
		
		type: function( obj ) {
			return obj == null ?
				String( obj ) :
				class2type[ toString.call(obj) ] || "object";
		},
		
		isPlainObject: function( obj ) {
			// Must be an Object.
			// Because of IE, we also have to check the presence of the constructor property.
			// Make sure that DOM nodes and window objects don't pass through, as well
			if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
				return false;
			}

			try {
				// Not own constructor property must be Object
				if ( obj.constructor &&
					!hasOwn.call(obj, "constructor") &&
					!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
					return false;
				}
			} catch ( e ) {
				// IE8,9 Will throw exceptions on certain host objects #9897
				return false;
			}

			// Own properties are enumerated firstly, so to speed up,
			// if last one is own, then all properties are own.

			var key;
			for ( key in obj ) {}

			return key === undefined || hasOwn.call( obj, key );
		}
	};
	
	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		if ( length === i ) {
			target = this;
			--i;
		}

		for ( ; i < length; i++ ) {
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null ) {
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray(src) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};
	
	var reTiObject = /^(\[object Ti|\[Ti\.)/;
	
	jQuery.isTiObject = function( obj ){
		return reTiObject.test(obj && obj.toString && obj.toString());
	};
	
	jQuery.extend(K, jQuery);
})();

//})(this);

/*** QSA ***/
/*!
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
			//klass = liveKlass||(exports = {}, Ti.include('kui/' + name + '.js'), exports.Class);
			
			/*
			klass = liveKlass || ((exp = require('kui/' + name)) && (typeof exp === 'object' && (typeof exp.Class === 'function' ? exp.Class(K) : exp.Class)) || (typeof exp === 'function' && exp(K)));
			if(typeof klass.extend !== 'function'){
				klass = K.classes[klass['extends'] || klass.ext].extend(klass);
			}
			*/
			
			klass = liveKlass || (require('kui/' + name)).Class;
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

		return Class;
	};

})(this);

/*** FILE ***/
/**
 * Define file module
 */

(function(){
	
	/**
	 * Simplified path map
	 */
	var pathMap = {
		res: Ti.Filesystem.resourcesDirectory,
		resources: Ti.Filesystem.resourcesDirectory,
		tmp: Ti.Filesystem.tempDirectory,
		temp: Ti.Filesystem.tempDirectory,
		app: Ti.Filesystem.applicationDirectory,
		data: Ti.Filesystem.applicationDataDirectory,
		support: Ti.Filesystem.applicationSupportDirectory
	};

	/**
	 * Simplified file handler
	 *
	 * @param {String} file 
	 * @returns {TiFile|String}
	 */
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
				case 'jade':
					res = f.exists() ? f.read().text : false;
					break;
			}
		} catch(e){ Ti.API.error(e); }
		return res;
	};

})();

/*** STYLE ***/
/**
 * Define style module
 */

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
	var getStyle = K.getStyle = function(opts, type, customType){
		if(typeof opts === 'string'){ opts = { className: opts }; }
		var hash = type + (customType || '') + (opts && opts.cls+opts.className),
			elStyle, c, i;

		if (!(elStyle = styleCache[hash])) {
			elStyle = styles[type] ? extend({}, styles[type]) : {};
			if(customType){
				elStyle = extend(elStyle, styles[customType]);
			}

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
		camelized = property.toCamel();
		
		//Ti.API.log('property', { property: property, hascamel: !!property.toCamel })
	
		//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', m]);

		if(m && m[0]){
			//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', eval('('+value.substring((m[1] && m[1].length) || 0)+')')]);
			obj[camelized] = eval('('+value.substring((m[1] && m[1].length) || 0)+')');
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
				str = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file).read().text.toString();
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


	/*!
	 * jQuery JavaScript Library v1.4.3
	 * http://jquery.com/
	 *
	 * Copyright 2010, John Resig
	 * Dual licensed under the MIT or GPL Version 2 licenses.
	 * http://jquery.org/license 
	 */
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

	/*!
	
	The following code comes from Flexie and Selectivizr, which has the following licenses:
	
	
	Flexie
	
	The MIT License
	
	Copyright (c) 2010 Richard Herrera

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	
	
	
    selectivizr v1.0.0 - (c) Keith Clark, freely distributable under the terms 
    of the MIT license.

    selectivizr.com
		    
	*/
	var WHITESPACE_CHARACTERS = /\t|\n|\r/g,
		EMPTY_STRING = "",
		PLACEHOLDER_STRING = "$1",
		END_MUSTACHE = "}",
	
		// Minification optimizations
		TRUE = true,
		FALSE = false,
		NULL = null,
		UNDEFINED = undefined;

		var psuedoMatchers = K.is;
		
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
(function(global){
	
	
	/**
	 * Define variables
	 */
	var rrep = /^(\w)(\w+)/,
		creators = {};
	
	/**
	 * Expose creators
	 */	
	K.creators = creators;	
	
	/**
	 * Default creation function used when subclassing basic element types
	 *
	 * @param {Object} o
	 * @returns {K.UI.Module}
	 */
	function defaultInit(o){
		var props = extend({}, this, o),
			el = (creators[this.type]||K.create)(props);

		el._props = props;
	    return (this.el = el);
	}

	/**
	 * Force Titanium to load basic types
	 */
	function forceLoad(){
		Ti.UI.create2DMatrix();
		Ti.UI.create3DMatrix();
		Ti.UI.createActivityIndicator();
		Ti.UI.createAlertDialog();
		Ti.UI.createAnimation();
		Ti.UI.createButton();
		Ti.UI.createButtonBar();
		Ti.UI.createCoverFlowView();
		Ti.UI.createDashboardItem();
		Ti.UI.createDashboardView();
		Ti.UI.createEmailDialog();
		Ti.UI.createImageView();
		Ti.UI.createLabel();
		Ti.UI.createMaskedImage();
		Ti.UI.createOptionDialog();
		Ti.UI.createPicker();
		Ti.UI.createPickerColumn();
		Ti.UI.createPickerRow();
		Ti.UI.createProgressBar();
		Ti.UI.createScrollView();
		Ti.UI.createScrollableView();
		Ti.UI.createSearchBar();
		Ti.UI.createSlider();
		Ti.UI.createSwitch();
		Ti.UI.createTab();
		Ti.UI.createTabGroup();
		Ti.UI.createTabbedBar();
		Ti.UI.createTableView();
		Ti.UI.createTableViewRow();
		Ti.UI.createTableViewSection();
		Ti.UI.createTextArea();
		Ti.UI.createTextField();
		Ti.UI.createToolbar();
		Ti.UI.createView();
		Ti.UI.createWebView();
		Ti.UI.createWindow();
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
	
	/**
	 * Map some types to easier names too
	 */
	var extraCreators = {
		TableViewRow: 'Row',
		TableViewSection: 'Section',
		ImageView: 'Image',
		MapView: 'Map',
		ActivityIndicator: 'Indicator'
	};
	
	/**
	 * Direct type to correct Ti module
	 */
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
	
	/**
	 * Optionally redirect event callbacks
	 */
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
			} 
		} else {
			return fn
		}
	}
	
	var extend = K.extend;
	
	/**
	 * Define creators
	 */
	[
		"2DMatrix", "3DMatrix", "ActivityIndicator", "AlertDialog", "Animation", 
		"Annotation", "Button", "ButtonBar", "CoverFlowView", "DashboardItem", 
		"DashboardView", "EmailDialog", "ImageView", "Label", "MapView", 
		"MaskedImage", "NavigationGroup", "OptionDialog", "Picker", "PickerColumn", 
		"PickerRow", "Popover", "ProgressBar", "ScrollView", "ScrollableView", 
		"SearchBar", "Slider", "SplitWindow", "Switch", "Tab", "TabGroup", 
		"TabbedBar", "TableView", "TableViewRow", "TableViewSection", "TextArea", 
		"TextField", "Toolbar", "View", "WebView", "Window"
	]
	.forEach(function(t){
		var type = t.toLowerCase(),
			elType = type,
			module = moduleByType[type]||Ti.UI,
			factoryString = 'create' + (factoryModifier[type]||t),
			extra,
			_silent = false;

			global[t] = K.classes[type] = Class.extend({
		        type: type,
		        init: defaultInit
			});

		/**
		 * Expose and define creators
		 */
		K[factoryString] = K.creators[type] = function(opts){
			var customType;
			opts = opts || {};
			
			if(opts._type){
				if(typeof opts.toString === 'function' && /^\[object Ti/.test(opts.toString())){
					return opts;
				} else {
					customType = opts._type;
				}
			}
			
			if(opts.silent === true){ _silent = true; }
			
			var o = extend(K.getStyle(opts, type, customType), opts), 
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
			
			/**
			 * Handle types pre-construct
			 */
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
					
					if(o.footerView){ o.footerView = K.create(o.footerView); }
					if(o.headerView){ o.headerView = K.create(o.headerView); }
					if(o.search){ o.search = K.createSearchBar(o.search); }
					break;

				case 'tableviewsection':
					if(K.isFunc(o.rows)){ o.rows = o.rows(); }
					
					if(o.footerView){ o.footerView = K.create(o.footerView); }
					if(o.headerView){ o.headerView = K.create(o.headerView); }
					
	 				if(o.headerTitle){ o.headerView = K.createView({ className: 'headerView', children: [{ type: 'label', text: o.headerTitle, className: 'headerLabel' }, { type: 'view', className: 'headerBack' }] }); }
					delete o.headerTitle;
					if(o.headerPlain){ o.headerTitle = o.headerPlain; }
					o.rows = (o.rows || []).map(K.createTableViewRow);
					if(K.is.android){
						var sectionRows = o.rows;
						delete o.rows;
					}
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
					if(K.is.ios){
						o.tabs = K.create(o.tabs, { type: 'tab' });
					} else {
						o._tabs = o.tabs;
						delete o.tabs;
					}
					break;
					
				case 'splitwindow':
					o.masterView = K.create(o.masterView, { type: 'navigationgroup' });
					o.detailView = K.create(o.detailView, { type: 'navigationgroup' });
					break;
					
				case 'navigationgroup':
					o.window = K.create(o.window, { type: 'window' });
					break;
					
				case 'scrollableview':
					o.views = K.create(o.views);
					break;
					
			}

			/**
			 * Create actual TiObject
			 */
			delete o.type;
			if(typeof o.intype !== 'undefined'){
				o.type = o.intype;
				delete o.intype;
			}
			var el = module[factoryString](o);
			el._uuid = ++uuid;
			el._type = type;
			if(customType){
				el._customType = customType;
			}
			el._opts = opts;
			el._id = id;

			/**
			 * Handle types post-construct
			 */
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
				
				case 'tableviewsection':
					if(K.is.android){
						sectionRows.forEach(function(row){
							el.add(row);
						});
					}
					break;
					
				case 'window':
					if(o.loadify){ K.loadify(el); }
					break;
					
				case 'textfield':
				case 'textarea':
					el.addEventListener('focus', function(e){
						K._focusedField = el;
					});
					break;
			}

			/**
			 * Add children
			 */
			(children || []).forEach(function(child){
				//child.parentNode = el;
				el.add(K.create(child));
			});

			/**
			 * Cache selectables from el if not silent
			 */
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

			/**
			 * Handle events
			 */
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
		
		/**
		 * Alias extra creators
		 */
		if((extra = extraCreators[t])){
			var extraType = extra.toLowerCase();
			global[extra] = K.classes[extraType] = Class.extend({
		        type: type,
		        init: defaultInit
			});
			
			K['create' + extra] = creators[extraType] = creators[type];
		}
	});

	/**
	 * Wrap custom creators with extra logic
	 *
	 * @param {Function} creator
	 * @returns {Function}
	 */
	var instanceCounter = 0,
		instances = {};
		
	K._wrapCustomCreator = function(creator, type){
		return function(o){
			
			o._type = type;
			delete o.type;
			
			var inst = ++instanceCounter;
			o._inst = inst;

			var obj = new creator(o),
				el = obj.el;
			
			if(!el._type){
				el = K.creators[(el.type||'view')](el);
			};
			(K.elsByName[type]||(K.elsByName[type] = [])).push(el);
			el.inst = obj;

			instances[inst] = obj;
			return el;
		}
	}

	/**
	 * Get a Klass instance from a custom object
	 *
	 * @param {Function} creator
	 * @returns {Function}
	 */
	K.getInst = function(el){
		return instances[el._inst];
	};
	
	/**
	 * Magic element creator. Autoloads custom modules if needed
	 *
	 * @param {Object} o Element blueprint
	 * @param {Object} [def] Default properties to augment each created element with
	 * @returns {TiObject||Array}
	 */
	K.create = function(o, def, overriders){
		if(o instanceof Array){ return o.map(function(el){ return K.create(el, def); }); }
		if(o && o._type){ return o; }
		
		var obj;
		if(typeof o === 'string' || o instanceof String){
			return K.jade(o);		
		}
		
		if(def && typeof def === 'object'){
			o = K.extend({}, def, o);
		}

		var type = o&&o.type;

		if(!type){
			Ti.API.log('Missing type', [o, type]);
			return K.createLabel({ text:'mtype' });
		}

		if(type && !K.creators[type]){
			
			var creator = K.loadClass(type)||function(){ Ti.API.error(type + ' not available'); },
				wrapped = K._wrapCustomCreator(creator, type);
				
			K.classes[type] = creator;
			K.creators[type] = wrapped;
			obj = wrapped(o);
			
		} else {
			obj = (K.creators[type])(o);
		}

		return obj.el||obj;
	};
	
})(this);

/*** AJAX ***/
/**
 * Define AJAX module
 */

(function(global){

    /**
     * Default AJAX settings
     */
	var noop = function(){}, 
		ajaxDefaults = {
		cache: true,
		data: {},
		error: function(e, opts){
			K.createAlertDialog({
				buttonNames: [K.l('try_again'), K.l('cancel')],
				cancel: 1,
				title: K.l('communication_error'),
				message: K.l('communication_error_description'),
				click: function(e){
					if(e.index == 0){
						K.ajax(opts);
					}
				}
			}).show();
		},
		appcacheAge: 360000000,
		appcache: false, // TODO - set this to false!!
		timeout: 30000,
		success: noop,
		type: 'GET',
		dataType: 'json'
		};

	/**
	 * Simplified ajax
	 *
	 * @param {Object} inOpts containing
	 * * type
	 * * dataType
	 * * data
	 * * success
	 * * error
	 * * timeout
	 * @returns {Ti.Network.HTTPClient} The resulting HTTPClient
	 */
	K.ajax = function(inOpts){
		var opts = K.extend(K.extend({}, ajaxDefaults), inOpts);
		
		var _error = opts.error;
		opts.error = function(e){
			_error.call(this, e, opts);
		};
		
		var	xhr = Ti.Network.createHTTPClient(opts), 
			data = typeof opts.data === 'object' ? K.extend(opts.data, opts.extendData || {}) : opts.data,
			loader = { 
				_hide: function(){
					K.doneify(opts.loader);
				}, 
				_show: function(){
					K.loadify(opts.loader, null, opts.loaderMessage || (K.is.android ? K.l('loading') : ''), !!(opts.loaderModal || opts.loaderMessage), function(){ 
						
						K.doneify(opts.loader);
						K.notify(opts.cancelMessage);
						xhr._aborted = true;
						xhr.abort();
						
					});
				} 
			},
			hash;
	
		if(opts.loader){
			loader._show();
		}
		xhr.inOpts = inOpts;
	
		if(!opts.url){
			loader._hide();
			return false;
		}
		 
		xhr.onload = function(){
			try {
				if(Number(xhr.status.toString()[0]) > 3){
					this.error && this.error.call(xhr, null);
				} else {
					var text = typeof opts.preprocess === 'function' ? opts.preprocess(this.responseText) : this.responseText,
						response;

					switch (opts.dataType) {
						case 'json':
							try {
								response = JSON.parse(text);
							}
							catch(e){
								Ti.API.error(e);
								Ti.API.error(text);
							}
							break;

						default:
							response = text;
							break;
					}


					opts.success && opts.success.call(opts.context || xhr, response, xhr.status, xhr);
					opts.complete && opts.complete(xhr, ({200:'success',304:'notmodified'})[xhr.status]||'error');
				}

				loader._hide();
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
				opts.error && opts.error(e);
				//if( (opts.error && opts.error(e) !== false) || !opts.error){ xhr.defError(e); }
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

	/**
	 * Change default AJAX settings
	 *
	 * @param {Object} opts containing any or all of
	 * * type
	 * * dataType
	 * * data
	 * * success
	 * * error
	 * * timeout
	 */
	K.ajaxSetup = function(opts){ K.merge(ajaxDefaults, opts); };

	/**
	 * YQL service path
	 */
	var yqlStart = 'http://query.yahooapis.com/v1/public/yql',
		yqlEnd = '&format=json&callback=';
	
	/**
	 * YQL interface
	 *
	 * @param {Object} opts containing
	 * * q
	 * * params
	 * * success
	 * * error
	 * * timeout
	 * @returns {Ti.Network.HTTPClient} The resulting HTTPClient
	 */	
	
	K.yql = function(opts){
		opts.url = yqlStart;
		opts.data = ('format=json&callback=&diagnostics=true&q=' + opts.q).esc(opts.params, encodeURIComponent).toString();
		opts.type = 'POST';
		opts.headers = {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
		};
		return K.ajax(opts);
	};
	
	// From Zepto
	/*$.get = function(url, success) {
		$.ajax({
			url: url,
			success: success
		})
	};*/
	$.post = function(url, data, success, dataType) {
		if ($.isFunction(data)) dataType = dataType || success,
		success = data,
		data = null;
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: dataType
		});
	};
	$.getJSON = function(url, success) {
		$.ajax({
			url: url,
			success: success,
			dataType: 'json'
		})
	};


})(this);

/*** LIVE ***/
/**
 * Define live module
 */

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
/**
 * Define stringify module
 */

/*!
TiObject stringifier is based heavily on code from @rem's JSConsole, which has the following license

Copyright (c) 2010 Remy Sharp, http://jsconsole.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

(function(global){
	var reTiObject = /^\[object Ti/;
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

/*** BACKBONEINTEGRATION ***/
(function(global){
	
	var collectionsByInst = {};
	
	try {
		
		var backboneInitiated = false;
		var initBackbone = K.initBackbone = function(){
			try {
				Ti.include('/kranium/lib/backbone/underscore.js');
				Ti.include('/kranium/lib/backbone/backbone.js');
			
				var eventSplitter = /^(\w+)\s*(.*)$/;
				_.extend(Backbone.View.prototype, Backbone.Events, {
					tagName: 'view',

					make: function(tagName, attributes, content){
						return K.create({ type: tagName, attr: attributes, content: content });
					},

					delegateEvents: function(events) {
						Ti.API.log('delegately', [events, this.events]);
						if (! (events || (events = this.events))) return;
						$(this.el).unbind();
						for (var key in events) {
							var methodName = events[key];
							var match = key.match(eventSplitter);
							var eventName = match[1],
								selector = match[2];
							var method = _.bind(this[methodName], this);
							Ti.API.log('bindly', [eventName, selector]);
							if (selector === '') {
								$(this.el).bind(eventName, method);
							} else {
								$(this.el).delegate(selector, eventName, method);
							}
						}
					}

				});
			} catch(e){
				Ti.API.error(e);
			}
			
			if(Backbone){
				backboneInitiated = true;
			}
		}
		
		var simpleTypes = ["activityindicator", "alertdialog", "animation", "annotation", "button", "buttonbar", "coverflowview", "dashboarditem", "dashboardview", "emaildialog", "imageview", "label", "mapview", "maskedimage", "navigationgroup", "optiondialog", "picker", "pickercolumn", "pickerrow", "popover", "progressbar", "scrollview", "scrollableview", "searchbar", "slider", "splitwindow", "switch", "tab", "tabgroup", "tabbedbar", "tableview", "tableviewrow", "tableviewsection", "textarea", "textfield", "toolbar", "view", "webview", "window"];
		

		global.BackboneView = View.extend({
			renderCollection: function(){
				var collection = this.getCollection();
				if(collection && collection.map){
					var data = collection.map(function(model){
						return (model.el = K.creators[model.type](K.extend({ _modelId: model.id, _modelCid: model.cid }, model.attributes)));
					});

					this.el.setData(data);
				}
				
			},
			renderModel: function(model) {
				var collection = this.getCollection(),
					opts = {},
					type,
					el,
					key;
				
				if(collection){
					type = model.type;
					el = model && model.el;
				} else {
					opts = this._baseOpts;
					type = this.use || 'label';
					el = model.el;
				}

				var isSimple = simpleTypes.indexOf(type) !== -1,
					recreate = !isSimple,
					changed = model.changedAttributes();

				if(el){
					/*for(key in changed){
						if(typeof el[key] === 'undefined'){
							recreate = true;
						}
					}*/

					if(!recreate){
						for(key in changed){
							el[key] = changed[key];
						}
					} else {
						var $el = K(el),
							$parent = $el.parent();

						$el.remove();
						$parent.append((model.el = K.creators[type](K.extend(opts, model.attributes))));
					}
				} else {
					model.el = K.creators[type](model.attributes);
				}
				
				collection && collection.sort();
				return this;
			},

			getCollection: function(){
				return collectionsByInst[this._inst];
			},

			template: function(o){
				return K.extend({}, this._props, o, { type: this._klass });
			},

			init: function(o){
				
				if(!backboneInitiated){
					initBackbone();
				}
				
				var collection = o.collection || this.collection;
			
				if(collection && typeof o._inst !== undefined){
					collectionsByInst[o._inst] = collection;
				}
				
				delete this.collection;
				delete o.collection;
				
				if(this.model && !collection){
					
					var opts = K.extend({ type: this.use || this.type }, o, this.model.attributes);
					delete opts.model;
					
					this._baseOpts = o;
					this.el = this.model.el = K.create(opts);
				} else {
					this._super(o);
				}
				
					
				if(this.model){
					this.model.bind('change', this.renderModel.bind(this));
				}
				
				if(collection){
					this.renderCollection(collection);

					collection.bind('refresh', this.renderCollection.once(this));
					collection.bind('change', this.renderModel.bind(this));
					collection.bind('add', this.renderCollection.bind(this));

				}

			}

		});
	} catch (e){ Ti.API.error(e); }
})(this);

/*** END ***/
/**
 * Define end module
 */

(function(global){
	Ti.include('/kranium/kranium-generated-bootstrap.js');
})(this);


/*** TESTER ***/
/**
 * Define tester module
 * Jasmine tester
 */

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

/*** JADE-LOADER ***/
/**
 * Define Jade loader
 * Only load Jade when needed, and then only do it once.
 */
(function(){
	
	String.prototype.jaded = function(o){
		var str = new String(this);
		str._jadeInput = o;
		return str;
	};
	
	K.jade = function(jadeStr, o){
		Ti.include('/kranium/lib/kranium-jade.js');
		if(K.jade.isLoader){
			throw 'something went wrong while loading jade';
		}
		return K.jade(jadeStr, o);
	};
	K.jade.isLoader = true;
})();

/*** ANDROIDSHIM ***/
(function(){

if(K.is.android){
	
	K.style('kranium/lib/kss/androidshim.kss');
	
	// Shim the buttonbar and tabbedbar modules
	function createSegmentedCreator(type){
		var camelized = ({
			buttonbar: 'buttonBar',
			tabbedbar: 'tabbedBar'
		})[type];
		
		return function(opts){
			var onClicks = [];
			if(opts.click){
				onClicks.push(opts.click);
				delete opts.click;
			}

			var	labelWidth = (dipToPx(opts.width) || Ti.Platform.displayCaps.platformWidth) / opts.labels.length,
				backgroundColor = opts.backgroundColor || K.getStyle(null, type).backgroundColor || '#ccc',
				selectedBackgroundColor = K.changeColor(backgroundColor, 0.2, true),
				labels = (opts.labels||[]).map(function(o, i){
					var events = {
						click: function(){
							var me = this;
							if(type === 'tabbedbar'){
								if(bar.index === i){ return; }
								labels[bar.index].backgroundColor = backgroundColor;
								labels[i].backgroundColor = selectedBackgroundColor;
								bar.index = i;
							}

							onClicks.forEach(function(callback){
								callback.call(me, {
									index: i,
									source: bar
								});
							});
						}
					};
					if(typeof o === 'string'){
						o = { 
							type: 'label', text: o, 
							backgroundColor: type === 'tabbedbar' && i === (opts.index||0) ? selectedBackgroundColor : backgroundColor
						};
						
						events.touchstart = function(){
							if(type === 'tabbedbar' && bar.index === i){ return; }
							this.backgroundColor = selectedBackgroundColor;
						};
						
						events.touchend = function(){
							if(type === 'tabbedbar' && bar.index === i){ return; }
							this.backgroundColor = backgroundColor;
						}
						
						events.touchcancel = function(){
							if(type === 'tabbedbar' && bar.index === i){ return; }
							this.backgroundColor = backgroundColor;
						}
					}
					o.className = (o.className||'') + ' ' + camelized + 'Label';

					return K.create(K.extend({
						width: labelWidth,
						left: labelWidth*i,
						events: events
					}, o));
				});


			var separators = [];
			labels.forEach(function(label, i){
				if(i > 0){
					separators.push(K.createView({
						top: 0,
						width: 2,
						height: '44dp',
						left: labelWidth*i - 1,
						backgroundImage: 'kranium/lib/images/android-navbar-separator.png'
					}));
				}
			});

			var bar = K.createView(K.extend({
				index: 0,
				height: '44dp',
				children: labels.concat(separators)
			}, K.getStyle(null, type), opts));
			return bar;
		};
	}
	
	K['createTabbedBar'] = K.creators['tabbedbar'] = createSegmentedCreator('tabbedbar');
	K['createButtonBar'] = K.creators['buttonbar'] = createSegmentedCreator('buttonbar');
	
	// Shim the window module with pretty navbars with left- and rightNavButtons.
	Window = K.classes['window'] = Window.extend({
		init: function(o){
			if(!this.navBarHidden && this.useCustomAndroidNavBar !== false && K.settings.useCustomAndroidNavBar !== false && (this.title || this.leftNavButton || this.rightNavButton)){
				this.navBarHidden = true;

				var barColor = K.getStyle(null, 'window').barColor;
				this._navBar = K.create({
					type: 'view',
					className: 'navBar',
					backgroundImage: 'kranium/lib/images/android-navbar-overlay.png',
					children: [{
						type: 'label',
						className: 'navBarLabel',
						text: this.title || ''
					}]
				});

				this.children = [
					{
						type: 'view',
						className: 'navBarGradient',
						backgroundColor: barColor
					},
					this._navBar,
					{
						type: 'view',
						className: 'navBaredContent',
						children: this.children
					}
				];
				
				if(this.rightNavButton){
					this.setRightNavButton(this.rightNavButton);
				}
				if(this.leftNavButton){
					this.setLeftNavButton(this.leftNavButton);
				}
			}

			this._super(o);
		},
		
		_setNavButton: function(navButton, rightLeft){
			if(!navButton){
				return;
			}
			var navButtonOptions = navButton._opts || navButton,
				navButtonClass = (rightLeft || 'right') + 'NavButton',
				navButtonName = '_' + navButtonClass,
				separatorName = navButtonName + 'Separator';
				
			navButtonOptions.className = (navButtonOptions.className||"") + " " + navButtonClass + " navButton";
			
			if(this[navButtonName]){
				this._navBar.remove(this[navButtonName]);
			}
			
			this[navButtonName] = K.createButton(navButtonOptions);
			
			if(!this[separatorName]){
				this[separatorName] = K.createView({
					className: 'navBarSeparator'
				});
				this._navBar.add(this[separatorName]);
			}
			this[separatorName][rightLeft||'right'] = this[navButtonName].width;
			
			this._navBar.add(this[navButtonName]);
		},
		
		setRightNavButton: function(navButton){
			this._setNavButton(navButton, 'right');
		},
		
		setLeftNavButton: function(navButton){
			this._setNavButton(navButton, 'left');
		}
	});
	

	// Shim the toolbar module
	K['createToolbar'] = K.creators['toolbar'] = function(opts){
		var	toolbarWidth = opts.width||K.getStyle({ type: 'toolbar', className: opts.className }).width || Ti.Platform.displayCaps.platformWidth,
			numSpacers = 0,
			widthSum = 0;
				
		(opts.items||[]).forEach(function(o, i){
			if(o === 'spacer'){
				numSpacers++;
				return o;
			} else {
				var itemWidth = dipToPx(o.width || K.getStyle({
					type: o.type,
					className: 'toolbarItem ' + (o.className||o.cls||'')
				}).width);
				
				if(itemWidth){
					widthSum += itemWidth;
				} else {
					numSpacers++;
				}
			}			
		});
		
		var left = 0,
			spacerWidth = (toolbarWidth - widthSum)/numSpacers;
					
		var items = [];
		(opts.items||[]).forEach(function(o, i){
			if(o === 'spacer'){
				left += spacerWidth;
			} else {
				if(typeof o === 'string'){
					o = { type: 'label', text: o, width: spacerWidth };
				}
				o.className = 'toolbarItem ' + (o.className||'');

				o.left = left;
				
				var width = dipToPx(o.width || K.getStyle({
					type: o.type,
					className: 'toolbarItem ' + (o.className||o.cls||'')
				}).width || spacerWidth);
				o.width = width;
				
				var el = K.create(o);
				left += dipToPx(el.width||0);
				items.push(el);
			}
		});
		
		var toolbar = K.createView(K.extend({
			height: '44dp',
			width: toolbarWidth,
			className: 'toolbar',
			children: items
		}, opts));
		
		return toolbar;
	};


	function dipToPx(str){
		var parts = String(str).match(/^([\d\.]+)(\w*)$/),
			value;
		
		if(parts){
			value = parts[2] == 'dp' || parts[2] == 'dip' ? 
				Math.round(Ti.Platform.displayCaps.dpi / 160 * parts[1]) : 
				Number(parts[1]);
		} else {
			value = 0;
		}

		return value;
	}

	// Custom tabGroup
	
	var zIndexCounter = 1;
	
	function Tab(opts, tabGroup){
		var me = this,
			i = tabGroup.tabs.length,
			isLast = tabGroup.getNumberOfTabs() === i,
			isFirst = i === 0,
			width = tabGroup._getTabWidth();

		this.tabIndex = i;
		
		this._tabButton = K.createView({
			width: width,
			className: 'tabButton',
			left: width * i,
			children: [{
				type: 'label',
				className: 'tabButtonLabel tabButtonLabel' + (opts.icon ? 'With' : 'Without') + 'Icon',
				text: opts.title || (opts.title + 'i'),
			}]
			.concat(!isFirst ? [(this._tabSeparator = K.createView({
				className: 'tabButtonSeparator'
			}))] : [])
			.concat(opts.icon ? [{
				type: 'image',
				image: opts.icon,
				className: 'tabButtonIcon'
			}] : []),
			click: this.activate.bind(this),
			events: {
				touchstart: function(e){
					if(me.isActiveTab){ return; }
					me.setState('pressed');
				},
				touchend: function(e){
					if(me.isActiveTab){ return; }
					me.setState('active');
				},
				touchcancel: function(e){
					if(me.isActiveTab){ return; }
					me.setState('inactive');
				}
			}
		});
		
		this.tabGroup = tabGroup;
		this.tabGroup._tabButtonContainer.add(this._tabButton);
		
		this.opts = opts;
		this.setState('inactive');
		
		(K.elsByName['tab']||(K.elsByName['tab'] = [])).push(this);
	}
	
	Tab.prototype.activate = function(){
		if(!this.window){
			var fromBottom = K.getStyle({ type: 'tab' }).height || K.getStyle({ type: 'tabBar' }).height || '50dp';
				defaults = { left: 0, right: 0, top: 0, bottom: fromBottom, zIndex: ++zIndexCounter },
				opts = K.extend(this.opts.window, defaults);
				
			this.window = K.create(opts, { type: 'view' });
			if(this.window._type === 'window'){
				var view = K.createView(opts),
					children = this.window.children,
					child;
								
				for(var i = 0; i < children.length; i++){
					child = children[i];
					view.add(child);
				}
				
				this.window = view;
			}
			this.tabGroup._container.add(this.window);
		}
		
		this.tabGroup.index = this.tabIndex;
		if(this !== this.tabGroup.activeTab){
			this.window.left = 0;
			if(this.tabGroup.activeTab){ 
				this.tabGroup.activeTab.window.hide();
				this.tabGroup.activeTab.isActiveTab = false;
			}

			this.setState('active');
			this.window.show();

			this.isActiveTab = true;
			this.tabGroup.activeTab = this;

		} else {
			this.window.fireEvent('home');
		}
		
	};
	
	Tab.prototype.setState = function(state){
		switch(state){
			case 'pressed':
				this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonPressed' }).backgroundImage;
				break;
				
			case 'active':
				this.tabGroup.activeTab && this.tabGroup.activeTab.setState('inactive');
				this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonActive' }).backgroundImage;
				break;
			
			case 'inactive':
				this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonInactive' }).backgroundImage;
				break;
		}
	};
	
	Tab.prototype.open = function(win){	
		win.open({ fullscreen: false });
	};
	
	Tab.prototype.setSeparatorColor = function(color){
		this._tabSeparator && (this._tabSeparator.backgroundColor = color);
	};
	
	
	function TabGroup(opts){
		var me = this,
			pauseListener = opts && opts.events && opts.events.pause,
			resumeListener = opts && opts.events && opts.events.resume,
			resumedListener = opts && opts.events && opts.events.resumed,
			openListener = opts && opts.events && opts.events.open,
			destroyListener = opts && opts.events && opts.events.destroy;

		this.onOpenCallbacks = [];
		this.tabs = [];

		this._tabButtonContainer = K.create({
			type: 'view',
			className: 'tabButtonContainer',
			//visible: false
		});

		var stopCounter = 0,
			resumeCounter = 0;
		this._container = K.createWindow({
			className: 'tabGroupWindow',
			navBarHidden: true,
			exitOnClose: true,
			windowSoftInputMode: Ti.UI.Android && Ti.UI.Android.SOFT_INPUT_ADJUST_PAN,
			children: [this._tabButtonContainer],
			setActiveTab: this.setActiveTab.bind(this),
			getActiveTabIndex: this.getActiveTabIndex.bind(this),
			events: {
				open: function(e){
					
					me.setActiveTab(opts.index || 0);
					Ti.Gesture.addEventListener('orientationchange', me._onOrientationChange.bind(me));
										
					Ti.Android.currentActivity.addEventListener('stop', function(e){
						if(typeof pauseListener === 'function'){
							pauseListener.call(me._container);
						}
						me._container.fireEvent('pause');
					});
					
					Ti.Android.currentActivity.addEventListener('resume', function(e){
						if(typeof resumeListener === 'function'){
							resumeListener.call(me._container);
						}
						if(typeof resumedListener === 'function'){
							resumedListener.call(me._container);
						}
						me._container.fireEvent('resume');
						me._container.fireEvent('resumed');
					});
					
					Ti.Android.currentActivity.addEventListener('destroy', function(e){
						me._container.fireEvent('destroy');
						if(typeof destroyListener === 'function'){
							destroyListener.call(me._container);
						}
					});

					if(typeof openListener === 'function'){
						openListener.call(me._container);
					}
					
				}
			}
		});
		
		this._tabs = opts.tabs;
		
		opts.tabs.forEach(function(o, i, arr){
			me.addTab(o, true);
		});
		
		var windowStyle = K.getStyle({ type: 'window' }),
			tabGroupStyle = K.getStyle({ type: 'tabGroup', className: 'tabButtonContainer' }),
			tabStyle = K.getStyle({ type: 'tab' });
		
		this.setBackgroundColor(windowStyle.barColor || tabGroupStyle.backgroundColor || tabStyle.backgroundColor || '#aaa');
		this.repaint();
		
		(K.elsByName['tabgroup']||(K.elsByName['tabgroup'] = [])).push(this);
	}
	
	TabGroup.prototype.open = function(){
		var me = this;
		this._container.open();
	};
	
	TabGroup.prototype.close = function(){
		var me = this;
		this._container.close();
	};
	
	TabGroup.prototype.getNumberOfTabs = function(){
		return (this.tabs && this.tabs.length) || (this._tabs && this._tabs.length) || 0;
	};
	
	TabGroup.prototype.setActiveTab = function(n){
		K.log(' ==== setactivetab', n);
		this.tabs[n] && this.tabs[n].activate();
		this.index = this._container.index = n;
	};
	
	TabGroup.prototype.getActiveTabIndex = function(n){
		return this.index;
	};

	
	TabGroup.prototype._getTabWidth = function(){
		return Math.ceil(Ti.Platform.displayCaps.platformWidth / this.getNumberOfTabs());
	};
	
	TabGroup.prototype.repaint = function(){
		/*if(!this._statusBarHeight){
			var winHeight = this._container.height,
				height = Ti.Platform.displayCaps.platformHeight;
				
			this._statusBarHeight = (height - winHeight) || 0;			
		}
		
		this._tabButtonContainer.top = Ti.Platform.displayCaps.platformHeight - this._statusBarHeight - dipToPx(this._tabButtonContainer.height);*/
		
		var width = this._getTabWidth();
		this.tabs.forEach(function(tab, i){
			tab._tabButton.width = width;
			tab._tabButton.left = width * i;
		});		
	};
	
	TabGroup.prototype._onOrientationChange = function(e){
		this._orientation = e.orientation;
		this.repaint();
	};

	TabGroup.prototype.setBackgroundColor = function(color){
		this._tabButtonContainer.backgroundColor = color;
		this.tabs.forEach(function(tab){
			tab.setSeparatorColor(color);
		});
	};
	TabGroup.prototype.setBarColor = TabGroup.prototype.setBackgroundColor;

	TabGroup.prototype.addTab = function(tab, skipRepaint){
		if(!(tab instanceof Tab)){
			tab = new Tab(tab, this);
		}
		this.tabs.push(tab);
		if(!skipRepaint){
			this.repaint();
		}
	}

	var tabGroup;
	K.createTabGroup = K.creators['tabgroup'] = function(opts){
		return new TabGroup(opts);
	};
	
	K.createTab = K.creators['tab'] = function(opts){
		return new Tab(opts);
	};
}

})();