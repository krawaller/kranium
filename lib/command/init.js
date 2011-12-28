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
	//this.createSymlinks();
	this.copyLibraryToApp();
	this.createAppBootstrap(opts);
	this.injectLibrary();
	
	this.startWatching(opts);
};

init.prototype = {
	
	createAppResources: function(){
		var created = 0;
		['Resources', 'Resources/kss', 'Resources/kui', 'Resources/test'].forEach(function(dir, i , arr){
			if(!path.existsSync(dir)){ fs.mkdirSync(dir, 0755); created++; }
		});
		
		if(created){
			"Structure created".log();
		}
	},
	
	copyLibraryToApp: function(){
		if(path.existsSync(this.appKraniumDir)){
			fs.renameSync(this.appKraniumDir, '../' + this.appKraniumDir + '-' + Date.now());
		}
		require('child_process').spawn('cp', ['-r', require.main.filename.replace(/[^\/]+$/, 'dist'), this.appKraniumDir]);
	},
	
	createSymlinks: function(){
		/*if(!path.existsSync(this.appLibDir)){
			fs.symlinkSync(require.main.filename.replace(/[^\/]+$/, 'dist'), this.appLibDir);
			"Kranium linked".log();
		}*/
		
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
			'exports.BootstrapOptions = {',
			'	bootstrapped: false',
			'	debug: ' + o.debug + ',',
			'	use_backbone: ' + o.backbone + ',',
			'	test: ' + o.test + ',',
			'	server: "' + o.ip + '",',
			'	port: "' + o.port + '",',
			'};'
		].join("\n");
	},
	
	createAppBootstrap: function(opts){
		var me = this,
			filename = this.appKraniumDir + '/BootstrapOptions.js';
				
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
			injector = 'var K = require("kranium/init").init({});\n\n';
			
		if(!(/require\(['"]kranium\/init['"]\)/.test(contents))){
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

