exports.Utils = function(K, global){
	
	var Utils = {
		isFunc: function(obj){ return toString.call(obj) === "[object Function]"; },


		get: function(key){ 
			var str = Ti.App.Properties.getString(key);

			try {
				return str != null ? JSON.parse(str) : null;
			} catch(e){
				return str;
			}
		},

		set: function(key, val){ 
			return Ti.App.Properties.setString(key, JSON.stringify(val)); 
		},

		alert: function(message, title){
			Ti.UI.createAlertDialog({
		        title: title || 'Obs!',
		        message: message
		    }).show();
		},

		log: function(){
			var args = Array.prototype.slice.call(arguments),
				out = (args.length > 1 ? args : args[0]);
				
			Ti.API.log("Kranium", K.is.android ? JSON.stringify(out) : out);
		},
		
		pad: function(num, totalChars) {
		    var pad = '0';
		    num = num + '';
		    while (num.length < totalChars) {
		        num = pad + num;
		    }
		    return num;
		},
		
		loadify: function(el, fn, msg, modal){
			var done;
			if(K.is.ios){
				var p = (el && el._p) || el || GLOBAL.win || Ti.UI.currentWindow;

				if(!p){ return; }

				if(modal){
					p = el._p = K.isTiObject(el) ? el : K(typeof el === 'string' ? el : 'tabgroup').get(0);
				} 

				if(p && !p._loader){
					p._loader = K.createActivityIndicator({
						className: (modal ? 'modalLoader' : 'loader') + ' ' + (modal ? 'modalLoader' : 'loader') + (p._type === 'tabgroup' ? 'TabGroup' : 'Window')
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
		},

		doneify: function(el){
			if(K.is.ios){
				var p = (el && el._p) || (el && el._type && el) || (K(typeof el === 'string' ? el : 'tabgroup').get(0)) || GLOBAL.win || Ti.UI.currentWindow;
				p && p._loader && setTimeout(p._loader.hide, 500);
			} else {
				androidIndicator.hide();
			}
		},
		
		// Notification popups
		notify: (function(){

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
			return function(msg){
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

		})(),
		
		// Enhanced localization
		l: (function(){
			var cache = {};
			return function(key, hint, obj, modifier){
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
		})()
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

		jQuery.extend(Utils, jQuery);
	})();
	
	//Ti.API.info(' ======== Utils has keys' + Object.keys(Utils));
	
	return Utils;
};