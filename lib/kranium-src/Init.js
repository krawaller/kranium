var global = this,
	defaults = {
		modules: {
			Core: true,
			Settings: true,
			Utils: true,
			Class: true,
			Create: true
		}
	},
	autoLoadingPropertiesByModule = {
		File: {
			file: 'read'
		}
	};


exports.init = function(userOptions){
	var $ = require('kranium/lib/Extend'),
		opts = $.extend(true, defaults, userOptions);
	
	var K;
	if(opts.modules.Core){
		K = require('kranium/lib/Core');
	} else {
		K = {};
	}
	
	$.extend(K, $);

	[
		"Utils", "SelectorEngine", "Class", 
		"File", "Style", "Create", "Ajax", "Live", 
		"BackboneIntegration", "Tester", "AndroidShim"
	].forEach(function(moduleName, i, arr){
		if(opts.modules[moduleName]){
			loadModule(K, moduleName);
		} else {
			autoLoad(K, moduleName);
			
			var autoLoadingProperties;
			if( (autoLoadingProperties = autoLoadingPropertiesByModule[moduleName]) ){
				for(var property in autoLoadingProperties){
					autoLoad(K, moduleName, property, autoLoadingProperties[property]);
				}
			}
		}
	});

};

function autoLoad(K, moduleName, accessProperty, moduleProperty){
	if(accessProperty && moduleProperty){
		Object.defineProperty(K, accessProperty, {
			get: function() {
				return loadModule(K, moduleName)[moduleProperty];
			},
			enumerable: true,
			configurable: true
		});
	} else {
		Object.defineProperty(K, moduleName, {
			get: function() {
				return loadModule(K, moduleName);
			},
			enumerable: true,
			configurable: true
		});
	}
	
}

function loadModule(K, moduleName){
	if(!moduleName){ return false; }
	if(K[moduleName]){ return K[moduleName]; }
	
	var before = Date.now();
	var exports = require('kranium/lib/' + moduleName),
		module = exports[moduleName];
		
	if(typeof module === 'function'){
		module = module(K, global);
	}
	delete K[moduleName];
	K[moduleName] = module;
	
	var expose = exports.__expose,
		sourceProperty,
		sourceValue;
		
	if(expose){
		for(var destinationProperty in expose){
			if(typeof K[destinationProperty] != null){
				delete K[destinationProperty];
			}
			sourceProperty = expose[destinationProperty];
			if(sourceProperty === '__alias'){
				sourceValue = module;
			} else {
				sourceValue = module[sourceProperty];
			}
			K[destinationProperty] = sourceValue;
		}
	}
	
	Ti.API.info(' ============ loaded "' + moduleName + '" in ' + (Date.now() - before) + 'ms');
	return module;
}

