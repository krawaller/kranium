exports.ExtendNatives = function(K, global){
	
	var Number = global.Number,
		Array = global.Array,
		String = global.String;
	
	if(!Number.prototype.round){
		Number.prototype.round = function(n){
			var n = n || 0, pow = Math.pow(10, n);
			return (Math.round(this * pow) / pow).toFixed(n >= 0 ? n : 0);
		};
	}

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

	if(!Array.prototype.pluck){
		Array.prototype.pluck = function(prop){
			return this.map(function(o){ return o[prop]; });
		};
	}

	/*
	 * Bind a function to a context
	 * @param ctx Context to run the function in
	 * @return Function applying new scope to original function
	 */
	var slice = Array.prototype.slice;
	if(!Function.prototype.bind){
		Function.prototype.bind = function(ctx){ 
			var fn = this;
			return function(){ 
				return fn.apply(ctx || fn, slice.call(arguments)); 
			}; 
		};
	}

	var slice = Array.prototype.slice;
	if(!Function.prototype.once){
		Function.prototype.once = function(ctx){ 
			var fn = this, i = 0;
			return function(){ 
				return ++i <= 1 && fn.apply(ctx || fn, slice.call(arguments)); 
			}; 
		};
	}

	/**
	 * Convert camelCase to dashed notation
	 * @return String with uppercase letters converted to dashed notation
	 */
	if(!String.prototype.toDash){
		String.prototype.toDash = function(){
			return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
		};
	}


	/**
	 * Convert dashed notation to camelCase
	 * @return String with dashed notation converted to camelCase
	 */
	if(!String.prototype.toCamel){
		String.prototype.toCamel = function(){
			return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
		};
	}

	/**
	 * Trim a string of leading and trailing whitespace
	 * @return String trimmed of whitespace
	 */
	var rtrim = /^\s+|\s+$/g;
	if(!String.prototype.trim){
		String.prototype.trim = function(){
			return this.replace(rtrim, "");	
		};
	}

	if(!String.prototype.esc){
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
	}
	
	return false;
	
};
