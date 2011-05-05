#!/usr/bin/env node
var nomnom = require('nomnom'),
	parser = nomnom(),
	path = require('path'),
	fs = require('fs');

(function(){
	
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
	}

	function cwdToTiRoot(){
		var cwd, found = false;
		while(!path.existsSync(process.cwd() + '/tiapp.xml') && (process.chdir('../'), (cwd = process.cwd()) !== '/'));
		return cwd !== '/';
	}

	if(!cwdToTiRoot()){
		return "No Titanium project found, KTHXBAI".err(); 
	}

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
	}).callback(autoload('./lib/command/init'));

	parser.command('watch').opts({
		debug: {
			string: '-d, --debug',
			help: 'set app to debug mode',
			"default": defaults.debug
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
	}).callback(autoload('./lib/command/watch'));

	parser.parseArgs();

})();
