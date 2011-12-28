/*** LICENSE ***/
/*!
 * Kranium
 * Copyright (c) 2011 Jacob Waller <jacob@krawaller.se>
 * Copyright (c) 2011 David Waller <david@krawaller.se>
 * MIT Licensed
 * 
 * Portions of the copyright belongs to the following entities
 * Simple JavaScript Inheritance (c) 2008 John Resig 
 * "mini" Selector Engine (c) 2009 James Padolsey
 * Jade (c) 2009-2010 TJ Holowaychuk <tj@vision-media.ca>
 * Jasmine (c) 2008-2011 Pivotal Labs
 * Zepto (c) 2010, 2011 Thomas Fuchs
 * JSConsole (c) 2010 Remy Sharp, http://jsconsole.com
 * selectivizr v1.0.0 - (c) Keith Clark
 * Flexie (c) 2010 Richard Herrera
 * changeColor (c) 2010 eyelidlessness
 * TitaniumReporter (c) 2011 Guilherme Chapiewski
 */



/*** VERSION ***/
KRANIUM_VERSION = "0.1.4";

/*** INIT ***/
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



/*** END ***/

(function(global){
	Ti.include('/kranium/kranium-generated-bootstrap.js');
})(this);
