String.prototype.err = function(){
	console.log(('[ERROR] ' + this.toString()).red.bold);
};

String.prototype.log = function(){
	console.log(('[INFO] ' + this.toString()).cyan.bold);
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

if(!Object.prototype.extendIf){
	Object.defineProperty(Object.prototype, "extendIf", {
	    enumerable: false,
	    value: function(from) {
	        var dest = this;
			for(var prop in from){
				if(typeof from[prop] !== 'undefined'){
					dest[prop] = from[prop];
				}
			}
	        return this;
	    }
	});
}

module.exports = {
	log: console.log
};