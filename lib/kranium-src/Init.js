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



/*!
 * Kranium Version 0.2.0
 */
KRANIUM_VERSION = "0.2.0";

/*** INIT ***/

var global = this,
	defaults = {
		autoload: true,
		expose: true,
		queryable: false,
		
		modules: {
			Core: true,
			Settings: true,
			ExtendNatives: true,
			Utils: true,
			SelectorEngine: true,
			Class: true,
			Style: true,
			UI: true,
			AndroidShim: Ti.Platform.osname === 'android'
		}
	},
	autoLoadingPropertiesByModule = {
	    Ajax: {
	        ajax: "ajax",
	        ajaxSetup: "ajaxSetup",
	        post: "post",
	        getJSON: "getJSON",
	        yql: "yql"
	    },
	    Class: {
	        loadClass: "load",
	        classes: "classes"
	    },
		Color: {
			changeColor: "change"
		},
	    File: {
	        file: "read"
	    },
		Jade: {
			"jade": "render"
		},
	    SelectorEngine: {
	        qsa: "__alias",
	        "$$": "__alias",
	        getElementsByClassName: "getElementsByClassName",
	        getElementsByTagName: "getElementsByTagName",
	        getElementById: "getElementById"
	    },
	    Style: {
	        _els: "elements",
	        styles: "styles",
	        extendStyle: "extend",
	        addStyle: "extend",
	        getStyle: "get",
	        loadStyle: "load",
	        refreshStyle: "refresh"
	    },
	    UI: {
	        create: "create",
	        getInst: "getInst",
	        creators: "creators"
	    },
	    Utils: {
	        isFunc: "isFunc",
	        get: "get",
	        set: "set",
	        alert: "alert",
	        log: "log",
	        pad: "pad",
	        loadify: "loadify",
	        doneify: "doneify",
	        notify: "notify",
	        l: "l",
	        stringify: "stringify"
	    },
	
		Settings: {
			settings: '__alias'
		}
	};


var K;
exports.init = function(userOptions, global){
	if(K){
		return K;
	}
	
	var $ = loadModule('Extend'),
		opts = $.extend(true, defaults, userOptions);
	
	if(opts.modules.Core){
		K = loadModule('Core');
		
	} else {
		K = {};
	}
	
	K.options = opts;
	$.extend(K, $);

	var autoLoadTotal = 0;
	[
		"Settings", "ExtendNatives", "Utils", "Color", "SelectorEngine", "Class", 
		"File", "Style", "UI", "Ajax", "Live", 
		"BackboneIntegration", "Tester", "AndroidShim", "Jade"
	].forEach(function(moduleName, i, arr){
		if(opts.modules[moduleName]){
			loadModule(K, moduleName, global);
		} else {
			if(K.options.autoload){
				var before = Date.now();
				autoLoad(K, moduleName);

				var autoLoadingProperties;
				if( (autoLoadingProperties = autoLoadingPropertiesByModule[moduleName]) ){
					for(var property in autoLoadingProperties){
						autoLoad(K, moduleName, global, property, autoLoadingProperties[property]);
					}
				}
				
				autoLoadTotal += Date.now() - before;
			}
		}
	});
	
	exports.K = K;
	K.Settings = K.extend(K.Settings, opts);
	
	K.log(' ===== Binding auto loaders took: ' + autoLoadTotal + 'ms');

	//TODO: idea, inject user options object in injected require clause
	//K.BootstrapOptions = require('kranium/BootstrapOptions').BootstrapOptions;
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
		//Ti.API.log(' ================== expose', expose);
		for(var destinationProperty in expose){
			if(typeof K[destinationProperty] != null){
				delete K[destinationProperty];
			}
			sourceProperty = expose[destinationProperty];
			if(sourceProperty === '__alias'){
				sourceValue = module;
			} else {
				sourceValue = (typeof sourceProperty === 'string' && module[sourceProperty]) || sourceProperty;
			}
			K[destinationProperty] = sourceValue;
		}
	}
	
	Ti.API.info(' ============ loaded "' + moduleName + '" in ' + (Date.now() - before) + 'ms');
	
	loadedModules[moduleName] = module;
	return module;
}
