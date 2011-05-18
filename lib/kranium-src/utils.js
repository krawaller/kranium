K.isFunc = function(obj){ return toString.call(obj) === "[object Function]"; };

K.get = function(str){ return JSON.parse(Ti.App.Properties.getString(str)); };
K.set = function(str, val){ return Ti.App.Properties.setString(str, JSON.stringify(val)); };

K.alert = function(message, title){
	Ti.UI.createAlertDialog({
        title: title || 'Obs!',
        message: message
    }).show();
};

K.log = function(a, b){
	Ti.API.log("Kranium", b ? Array.prototype.slice.call(arguments) : a);
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

if(!Object.prototype.extend){
	Object.defineProperty(Object.prototype, "extend", {
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
	        return ({}).extend(this);
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