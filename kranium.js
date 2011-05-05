#!/usr/bin/env node
var nomnom = require('nomnom'),
	parser = nomnom(),
	fs = require('fs');

var defaults = {
	port: 8128,
	ip: '127.0.0.1',
	test: false,
	debug: false
};

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
			return JSON.parse(fs.readFileSync(require.main.filename.replace(/[^\/]+$/, 'package.json'))).version;
		}
	}
});

parser.command('init').opts({
	debug: {
		string: '-d, --debug',
		help: 'set app to debug mode',
		"default": defaults.debug
	},
	
	test: {
		string: '-t, --test',
		help: 'activate app tests',
		"default": defaults.test
	},
	
	ip: {
		string: '-i, --ip',
		help: 'ip to bind to'
	},
	
	port: {
		string: '-p, --port',
		help: 'port to bind to',
		"default": defaults.port
	},
}).callback(autoload('./lib/init'));

parser.parseArgs();
