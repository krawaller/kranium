var fs = require('fs'),
	colors = require('colors'),
	path = require('path'),
	async = require('nimble'),
	l = require('./utils').log;

function init(opts){
	if(!this.cwdToTiRoot()){
		return "No Titanium project found".err(); 
	}
	this.createDirectories();
	this.createSymlinks();
	this.createAppBootstrap(opts);
};

init.prototype = {
	cwdToTiRoot: function(){
		var cwd, found = false;
		while(!path.existsSync(process.cwd() + '/tiapp.xml') && (process.chdir('../'), (cwd = process.cwd()) !== '/'));
		return cwd !== '/';
	},
	
	createDirectories: function(){
		var created = 0;
		['Resources', 'Resources/kss', 'Resources/kui'].forEach(function(dir, i , arr){
			if(!path.existsSync(dir)){ fs.mkdirSync(dir, 0755); created++; }
		});
		if(created){
			"Structure created".log();
		}
	},
	
	createSymlinks: function(){
		var filename = 'Resources/kranium.js';
		if(!path.existsSync(filename)){
			fs.symlinkSync(require.main.filename.replace(/[^\/]+$/, 'dist/kranium.js'), filename);
			"Kranium linked".log();
		}
	},
	
	bootstrapTemplate: function(o){
		return [
			'/* BEWARE - generated file ahead */',
			'(function(global){',
			'    if(global.BOOTSTRAPPED){ return; }',
				
			'    global.DEBUG = '+o.debug+';',
			'    global.TEST = '+o.test+';',
			'    global.BOOTSTRAPPED = true;',
				
			'    Ti.API.log("Livetanium", "Starting...");',
			'    K.watch("'+o.ip+'", "'+o.port+'");',
			'})(this);'
		].join("\n");
	},
	
	createAppBootstrap: function(opts){
		var me = this,
			filename = 'Resources/kranium-generated-bootstrap.js',
			defaults = {
				port: 8128,
				ip: '127.0.0.1',
				debug: false,
				test: false
			};
		
		async.series({ 
			ip: opts.ip ? function(callback){ callback(null, opts.ip); } : require('./getnetworkip')
		}, function(err, res){
			if(path.existsSync(filename)){
				fs.unlinkSync(filename);
			}
			fs.writeFileSync(filename, me.bootstrapTemplate(defaults.extendIf(res).extendIf(opts)));
		});
		
	}
};

module.exports = init;

