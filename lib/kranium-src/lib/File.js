var expose = {
	file: 'read',
};
exports.__expose = expose;

exports.File = function(K, global){
	/**
	 * Simplified path map
	 */
	var pathMap = {
		res: Ti.Filesystem.resourcesDirectory,
		resources: Ti.Filesystem.resourcesDirectory,
		tmp: Ti.Filesystem.tempDirectory,
		temp: Ti.Filesystem.tempDirectory,
		app: Ti.Filesystem.applicationDirectory,
		data: Ti.Filesystem.applicationDataDirectory,
		support: Ti.Filesystem.applicationSupportDirectory
	};

	/**
	 * Simplified file handler
	 *
	 * @param {String} file 
	 * @returns {TiFile|String}
	 */
	function read(file){
		var parts = file.match(/((\w+):\/\/)?(.*?\.?)(\w+)$/),
			dir = pathMap[parts[2]||'res']||pathMap.res,
			path = parts[3]+parts[4];
		
		
		var f = Ti.Filesystem.getFile(dir, path), res = f;
	
		try {
			switch(parts[4]){
				case 'txt':
				case 'js':
				case 'kss':
				case 'html':
				case 'css':
				case 'jade':
					res = f.exists() ? f.read().text : false;
					break;
			}
		} catch(e){ Ti.API.error(e); }
		return res;
	};
	
	return {
		read: read
	};
};