/**
 * Define utils
 */

//(function(global){

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

K.get = function(key){ 
	var str = Ti.App.Properties.getString(key);
		
	try {
		return str != null ? JSON.parse(str) : null;
	} catch(e){
		return str;
	}
};
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