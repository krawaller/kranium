String.prototype.err = function(){
	console.log(('[ERROR] ' + this.toString()).red.bold);
};

module.exports = {
	log: console.log
};