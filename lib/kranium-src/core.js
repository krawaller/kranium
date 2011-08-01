(function(global){

global.GLOBAL = global;
win = global.win||Ti.UI.currentWindow||{};

/**
 * Cache RegExps
 */
var reTiObject = /^\[object Ti/,
	reJadeStr = /(\.jade$|^\s*<)/,
	
	/**
	 * Inline utilit functions
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
	function arrayify(o){ return Array.isArray(o) ? o : [o]; }

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
	 * @param {String||Array||TiObject||Object} dom
	 * @param {String||Array||TiObject||Object} context
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
			else if (toString.call(selector) == '[object Object]' || (typeof selector === 'string' && reJadeStr.test(selector) )) dom = [K.create(selector)];
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
		 * @param {String||Object} [prop] Prop to set value to, or Object containg key-value-pairs
		 * @param {String} [val] Value to set prop to
		 * @returns {Z} Kranium collection
		 */
		set: function(prop, val){
			var props = (typeof prop === 'string') ? [{ key: prop, val: val }] : Object.keys(prop).map(function(key){ return { key: key, val: prop[key] }; }),
				i, o;
			return this.each(function(){
				i = props.length;
				while((o = props[--i])){
					this[o.key] = o.val;
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
		 * @returns {Inteer}
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
		 * Test if first element in collection matches selector
		 *
		 * @param {String} selector
		 * @returns {Z} Kranium collection
		 */
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
		},
		
		stringify: function(){
			return K.stringify(this);
		}

	};
	
	$.each = function(obj, iterator){
		(obj||[]).forEach(function(el){
			iterator.call(el, el);
		});
	}

	Z.prototype = $.fn;
	global.$ = global.K = global.jQuery = global.Zepto = $;
	global.J = function(jadeStr, o){
		return K(K.jade(jadeStr, o));
	};
	
	var platform = Ti.Platform.osname;
	$.is = {
		android: platform === 'android',
		ios: platform === 'iphone'
	};
	
})(this);


