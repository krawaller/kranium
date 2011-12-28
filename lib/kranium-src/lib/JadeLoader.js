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