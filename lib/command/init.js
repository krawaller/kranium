var fs = require('fs'),
	colors = require('colors'),
	path = require('path'),
	async = require('nimble'),
	exec = require('child_process').exec,
	l = require('../utils').log;

function init(opts){
	
	this.appKraniumDir = 'Resources/kranium';
	this.appLibDir = this.appKraniumDir + '/lib';
	this.appjsPath = 'Resources/app.js';
	this.mainPath = require.main.filename.replace(/[^\/]+$/, '');
	
	this.createAppResources();
	this.createSymlinks();
	this.createAppBootstrap(opts);
	this.injectLibrary();
	
	this.startWatching(opts);
};

init.prototype = {
	
	createAppResources: function(){
		var created = 0;
		['Resources', 'Resources/kss', 'Resources/kui', 'Resources/test', 'Resources/kranium'].forEach(function(dir, i , arr){
			if(!path.existsSync(dir)){ fs.mkdirSync(dir, 0755); created++; }
		});
		
		if(created){
			"Structure created".log();
		}
	},
	
	createSymlinks: function(){
		if(!path.existsSync(this.appLibDir)){
			fs.symlinkSync(require.main.filename.replace(/[^\/]+$/, 'dist'), this.appLibDir);
			"Kranium linked".log();
		}
		
		/*var kraniumTestLibFolder = this.mainPath + 'lib/kranium-src/test/lib',
			appTestLibFolder = process.cwd() + '/Resources/test/lib';

		if(!path.existsSync(appTestLibFolder)){
			fs.symlinkSync(kraniumTestLibFolder, appTestLibFolder);
			"Kranium testlib linked".log();
		}*/
	},
	
	bootstrapTemplate: function(o){
		return [
			'/* BEWARE - generated file ahead */',
			'(function(global){',
			'    if(global.BOOTSTRAPPED){ return; }',
				
			'    global.DEBUG = '+o.debug+';',
			'    global.USE_BACKBONE = '+o.backbone+';',
			'    global.TEST = '+o.test+';',
			'    global.BOOTSTRAPPED = true;',
				
			'    K.watch("'+o.ip+'", "'+o.port+'");',
			'})(this);'
		].join("\n");
	},
	
	createAppBootstrap: function(opts){
		var me = this,
			filename = this.appKraniumDir + '/kranium-generated-bootstrap.js';
				
		async.series({ 
			ip: opts.ip ? function(callback){ callback(null, opts.ip); } : function(callback){ require('../getnetworkip')(function(err, ip){ callback(null, ip||'127.0.0.1'); }); }
		}, function(err, res){
			if(path.existsSync(filename)){
				fs.unlinkSync(filename);
			}
			fs.writeFileSync(filename, me.bootstrapTemplate(res.extendIf(opts)));
		});
	},
	
	injectLibrary: function(){
		if(!path.existsSync(this.appjsPath)){
			fs.writeFileSync(this.appjsPath, '');
		}
		
		var contents = fs.readFileSync(this.appjsPath).toString(),
			injector = 'Ti.include("/kranium/lib/kranium.js");\n\n';
			
		if(!(/Ti(tanium)?\.include\(['"]\/kranium\/lib\/kranium\.js['"]\)/.test(contents))){
			fs.writeFileSync('./.app.js-' + Date.now(), contents);
			var fd = fs.openSync(this.appjsPath, 'w');
			fs.writeSync(fd, injector + contents, 0);
			fs.closeSync(fd);
			'Library injected'.log();
		}
	},
	
	startWatching: function(opts){
		new require('./watch')(opts);
	}
};

module.exports = init;

