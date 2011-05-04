#!/usr/bin/env node
var nomnom = require('nomnom'),
	parser = nomnom(),
	fs = require('fs');

function autoload(str){
	return function(opts){
		var fn = require(str);
		//fn.apply(fn, arguments);
		new fn(opts);
	};
};

parser.globalOpts({
	version: {
		string: '-v, --version',
		help: 'print version and exit',
		callback: function() {
			return JSON.parse(fs.readFileSync('package.json')).version;
		}
	}
});

parser.command('init').opts({
	
}).callback(autoload('./lib/init'));

parser.parseArgs();
