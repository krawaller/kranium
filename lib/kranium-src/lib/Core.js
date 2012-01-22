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

exports.Core = function(K, global){

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
			else dom = Array.isArray((tmp = K.$$(selector, null))) ? tmp : [tmp];			
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
				return K.$$(selector, element.getParent()).indexOf(element) >= 0;
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
			if (this.length == 1) result = K.$$(selector, this[0]);
			else result = flatten(this.map(function(el){ return K.$$(selector, el); }));
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
				nodes = K.$$(selector, context); //context !== undefined ? context : document);
			
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
							// This is were Rhino whines about threadstacksize. Can we make it slightly less threadstacky?
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
				parent = K.$$(parent)[0] || null;
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
								(typeof tmp === 'string') ? K.$$(tmp)[0] : tmp
							) || (
								(tmp = K.$$('tabgroup')) && tmp[0] && tmp[0].activeTab
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
	global.$ = global.K = global.jQuery = global.Zepto = K = $;
	
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
	$.compact = compact;
	$.flatten = flatten;
	$.camelize = camelize;
	$.arrayify = arrayify;
	
	return $;
};