/**
 * Define utils
 */

//(function(global){

K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

K.get = function(str){ return JSON.parse(Ti.App.Properties.getString(str)); };
K.set = function(str, val){ return Ti.App.Properties.setString(str, JSON.stringify(val)); };

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
			p = el._p = K('tabgroup').get(0);
		} 
	
		if(p && !p._loader){
			p._loader = K.createActivityIndicator({
				className: modal ? 'modalLoader' : 'loader',
				message: modal ? msg : ''
			});

			p.add(p._loader);
		}
		
		p._loader.message = msg || null;
		p._loader.show();
		p._loader.message = msg || null;
		
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
		var p = (el && el._p) || el || GLOBAL.win || Ti.UI.currentWindow;
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
				duration: Ti.UI.NOTIFICATION_DURATION_LONG,
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
	
		return (cache[key] = (Titanium.Locale.getString(key, hint)||'').replace(/(^|[^\w\d])@([A-Za-z_\-]+)\b/g, function($0, $1, name){
			return ($1||'')+modifier(obj && typeof obj[name] !== 'undefined' ? obj[name] : Titanium.Locale.getString(name));
		}));
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

//})(this);