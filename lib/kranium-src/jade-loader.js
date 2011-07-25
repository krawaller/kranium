(function(){
	K.jade = function(jadeStr, o){
		Ti.include('/kranium/lib/kranium-jade.js');
		if(K.jade.isLoader){
			throw 'something went wrong while loading jade';
		}
		return K.jade(jadeStr, o);
	};
	K.jade.isLoader = true;
})();