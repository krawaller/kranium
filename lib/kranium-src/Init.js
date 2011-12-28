
var global = this,
	defaults = {
		autoload: true,
		expose: true,
		modules: {
			Core: true,
			Settings: true,
			ExtendNatives: true,
			Utils: true,
			Class: true,
			Style: true,
			UI: true
		}
	},
	autoLoadingPropertiesByModule = {
		File: {
			file: 'read'
		}
	};


var K;
exports.init = function(userOptions, global){
	var $ = loadModule('Extend'),
		opts = $.extend(true, defaults, userOptions);
	
	if(opts.modules.Core){
		K = loadModule('Core');
		
	} else {
		K = {};
	}
	
	K.options = opts;
	$.extend(K, $);

	[
		"ExtendNatives", "Utils", "SelectorEngine", "Class", 
		"File", "Style", "UI", "Ajax", "Live", 
		"BackboneIntegration", "Tester", "AndroidShim"
	].forEach(function(moduleName, i, arr){
		if(opts.modules[moduleName]){
			loadModule(K, moduleName, global);
		} else {
			if(K.options.autoload){
				autoLoad(K, moduleName);

				var autoLoadingProperties;
				if( (autoLoadingProperties = autoLoadingPropertiesByModule[moduleName]) ){
					for(var property in autoLoadingProperties){
						autoLoad(K, moduleName, global, property, autoLoadingProperties[property]);
					}
				}
			}
		}
	});

	return K;
};

function autoLoad(K, moduleName, global, accessProperty, moduleProperty){
	if(accessProperty && moduleProperty){
		//Ti.API.log(' ======= bind autoload accessProperty', accessProperty);
		Object.defineProperty(K, accessProperty, {
			get: function() {
				//Ti.API.log(' ======= autoloading accessProperty', accessProperty);
				return loadModule(K, moduleName, global)[moduleProperty];
			},
			enumerable: true,
			configurable: true
		});
	} else {
		//Ti.API.log(' ======= bind autoload moduleName', moduleName);
		Object.defineProperty(K, moduleName, {
			get: function() {
				//Ti.API.log(' ======= do autoload moduleName', moduleName);
				return loadModule(K, moduleName, global);
			},
			enumerable: true,
			configurable: true
		});
	}
	
}

var loadedModules = {};
function loadModule(K, moduleName, global){
	
	if(!global){
		global = this;
	}
	
	if(typeof moduleName === 'undefined' && typeof K === 'string'){
		moduleName = K;
		K = null;
	}
	if(!moduleName){ return false; }
	if(moduleName in loadedModules){ return loadedModules[moduleName]; }
	
	loadedModules[moduleName] = false;
	
	var before = Date.now();
	var exports = require('kranium/lib/' + moduleName),
		module = exports[moduleName];

	if(K){
		delete K[moduleName];
	}

	if(typeof module === 'function'){
		module = module(K, global);
	}

	if(K){
		K[moduleName] = module;
	}

	var expose = exports.__expose,
		sourceProperty,
		sourceValue;

	if(expose && K && K.options.expose){
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
	
	loadedModules[moduleName] = module;
	return module;
}
