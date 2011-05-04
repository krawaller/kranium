var fs = require('fs'),
	colors = require('colors'),
	path = require('path'),
	l = require('./utils').log;

function init(opts){
	if(!this.cwdToTiRoot()){
		//return "No Titanium project found".err(); 
	}
	
	this.createDirectories();
	this.createSymlinks();

};

init.prototype = {
	cwdToTiRoot: function(){
		var cwd, found = false;
		while(!path.existsSync(process.cwd() + '/tiapp.xml') && (process.chdir('../'), (cwd = process.cwd()) !== '/'));
		return cwd !== '/';
	},
	
	createDirectories: function(){
		['Resources', 'Resources/kss', 'Resources/kui'].forEach(function(dir){
			if(!path.existsSync(dir)){ fs.mkdirSync(dir, 0755); }
		});
	},
	
	createSymlinks: function(){
		if(!path.existsSync('kranium.js')){
			fs.symlinkSync(require.main.filename.replace(/[^\/]+$/, 'dist/kranium.js'), 'kranium.js');
		}
	}
};

module.exports = init;

