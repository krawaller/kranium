var expose = {
	_els: 'elements',
	styles: 'styles',
	extendStyle: 'extend',
	addStyle: 'extend',
	getStyle: 'get',
	loadStyle: 'load',
	refreshStyle: 'refresh'
};
exports.__expose = expose;

exports.Style = function(K, global){
	
	var styles = {},
		extend = K.extend;
		
	function extendStyle(opts){
		K.extend(styles, opts || {});
	};

	// The current window - added to K._els to achieve immediate styling
	var thisWindow = (Ti.UI.currentWindow || global.win) || {};
	thisWindow._type = 'window';

	var els = [thisWindow]; //K._els = K._els || [thisWindow];
	var styleCache = {};

	/**
	 * Calculating style for object
	 * @param opts Object containing options OR String containing selector
	 * @param type String type of object
	 * @return Object of calculated style 
	 */
	function getStyle(opts, type, customType){
		if(typeof opts === 'string'){ opts = { className: opts }; }
		var hash = type + (customType || '') + (opts && opts.cls+opts.className),
			elStyle, c, i;

		if (!(elStyle = styleCache[hash])) {
			elStyle = styles[type] ? extend({}, styles[type]) : {};
			if(customType){
				elStyle = extend(elStyle, styles[customType]);
			}

			if (opts && (c = (opts.className || opts.cls))) {
				var parts = c.split(" "), len = parts.length;
				for (i = 0; i < len; i++) {
					if ((s = styles['.'+parts[i]])) {
						elStyle = extend(elStyle, s);
					}
				}
			}
			styleCache[hash] = elStyle;
		}
		return extend({}, elStyle);
	};

	/**
	 * Refresh all styles with optional style injection
	 * @param styleString String containing JSS to be parsed and injected into style. Optional.
	 */
	function refreshStyles(styleString, _els){
		if(styleString){
			styleCache = {};
			style(null, styleString);
		} 
		(_els ? (Array.isArray(_els) ? _els : [_els]) : els).forEach(function(el){
			var s = getStyle(el, el._type), p;
			for(p in s){
				el[p] = s[p];
			}
		});	
	};

	var reToCamel = /(\-[a-z])/g,
		cbToCamel = function($1){ return $1.toUpperCase().replace('-',''); };
		
	function toCamel(str){
		return str.replace(reToCamel, cbToCamel);
	};

	function parseRule(prop, obj){
		var m, val, camelized;
		obj = obj || {};
		
		m = prop.value.match(rEvalProp);
		value = prop.value;
		property = prop.property.trim();
		camelized = toCamel(property);
		
		//Ti.API.log('property', { property: property, hascamel: !!property.toCamel })
	
		//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', m]);

		if(m && m[0]){
			//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', eval('('+value.substring((m[1] && m[1].length) || 0)+')')]);
			try {
				obj[camelized] = eval('('+value.substring((m[1] && m[1].length) || 0)+')');
			} catch(e){
				Ti.API.error(e);
				obj[camelized] = null;
			}
		} else {
			switch(camelized){
				case 'shadowOffsetX':
					(obj.shadowOffset = obj.shadowOffset || {}).x = parseFloat(value);
					break;
				case 'shadowOffsetY':
					(obj.shadowOffset = obj.shadowOffset || {}).y = parseFloat(value);
					break;
				
				case 'fontFamily':
				case 'fontWeight':
				case 'fontSize':
					obj.font = obj.font || {};
					obj.font[camelized] = value;
					break;
				
				case 'backgroundGradient':
					var parts = value.match(/(\w+)-gradient\((\w+)\s?(\w+)?\s*,\s*(.*)\)/),
						gradientType = parts[1],
						gradientStartX = parts[2],
						gradientStartY = parts[3],
						colors = parts[4].split(",").map(function(c){ var p = c.match(/(\w+)\s+([\d.]+)/); return p && {color: '#'+p[1], position: p[2]}; });
					
						obj.backgroundGradient = { type: gradientType, colors:colors };
						//Ti.API.log('grad', JSON.stringify(obj.backgroundGradient));
						//Ti.API.log('OBJ', [gradientType, colors]);
					break;	
				
				default:
					//if(camelized == 'backgroundImage'){ Ti.API.log('info', JSON.stringify(value)); }
					obj[camelized] = value;
					break; 
			}
		}
		
		return obj;
	};

	/**
	 * Parse and apply styles found in specified file or in call
	 * @param file Filename containing styles. Optional
	 * @param str String containing styles. Optional
	 */
	var rEvalProp = /^(=)?(Ti|Titanium)?/;
	function style(file, str, applyStyles){
		try {
			if(!str){
				str = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file).read().text.toString();
			}
			var selectors = buildSelectorTree(str), m, val, prop, camelized;
			(selectors || []).forEach(function(sel){
				var obj = styles[sel.selector] = styles[sel.selector] || {};
				for(var i = 0, len = sel.properties.length; i < len; i++){
					parseRule(sel.properties[i], obj);
				}
				//sel.properties.forEach(K.parseRule);
				
				if(applyStyles){
					K(sel.selector).each(function() {
						var el = this;
						for(var property in obj){
							el[property] = obj[property];
						}
					});
				}
				
			});
		
			// Not sure about this, does it relate to Livetanium?!
			//refreshStyles();
		} catch(e){ Ti.API.log('style apply error', e); }
	};

	function loadStyle(filename){
		K.log(' ===== Loading styles for ' + filename);
		var contents, tmp, path = 'kss/' + filename + '.kss';
		if( (contents = K.File.read('res://'+path)) ){
			style(null, contents);
		}
	};


	/*!
	 * jQuery JavaScript Library v1.4.3
	 * http://jquery.com/
	 *
	 * Copyright 2010, John Resig
	 * Dual licensed under the MIT or GPL Version 2 licenses.
	 * http://jquery.org/license 
	 */
	function forEach(object, callback, reverse) {
		var name, i = 0, value,
			length = object.length,
			isObj = length === UNDEFINED;

		if (isObj) {
			for (name in object) {
				if (object.hasOwnProperty(name)) {
					if (callback.call(object[name], name, object[name]) === FALSE) {
						break;
					}
				}
			}
		} else {
			for (value = object[0]; i < length && callback.call(value, i, value) !== FALSE; value = object[++i]) {
				continue;
			}
		}
	}

	/*!
	
	The following code comes from Flexie and Selectivizr, which has the following licenses:
	
	
	Flexie
	
	The MIT License
	
	Copyright (c) 2010 Richard Herrera

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	
	
	
    selectivizr v1.0.0 - (c) Keith Clark, freely distributable under the terms 
    of the MIT license.

    selectivizr.com
		    
	*/
	var WHITESPACE_CHARACTERS = /\t|\n|\r/g,
		EMPTY_STRING = "",
		PLACEHOLDER_STRING = "$1",
		END_MUSTACHE = "}",
	
		// Minification optimizations
		TRUE = true,
		FALSE = false,
		NULL = null,
		UNDEFINED = undefined;

	var psuedoMatchers = K.is;
	
	function buildSelectorTree(text) {
		var rules = [], ruletext, rule,
			match, selector, psuedo, pidx, proptext, splitprop, properties, sidx, prop, val;

		// Tabs, Returns
		text = text.replace(WHITESPACE_CHARACTERS, EMPTY_STRING);
		// Leading / Trailing Whitespace
		text = text.replace(/\s?(\{|\:|\})\s?/g, PLACEHOLDER_STRING);
		//Ti.API.log('t1', text);
		ruletext = text.split(END_MUSTACHE);
		//Ti.API.log('t2', ruletext);
		forEach(ruletext, function (i, text) {
			if (text) {
				rule = [text, END_MUSTACHE].join(EMPTY_STRING);
				match = (/(.*)\{(.*)\}/).exec(rule);

				if (match && match.length && match[2]) {
					selector = match[1];

					proptext = match[2].split(";");
					properties = [];

					forEach(proptext, function (i, x) {
						sidx = x.indexOf(":");
						prop = x.substring(0, sidx).trim();
						val = x.substring(sidx+1).trim();

						if (prop) {
							properties.push({ property : prop, value : val });
						}
					});


					if (
						selector && 
						properties.length && 

						(pidx = selector.indexOf(":")) === -1 ? 
							true : 
							(
								(psuedo = selector.match(/:[^:]+/g)) && 
								(selector = selector.substring(0, pidx)) && 
								(psuedo.filter(function(p){ 
									return psuedoMatchers[p.substring(1)]; 
								}).length === psuedo.length)
							)

					) {
						rules.push({ selector : selector, properties : properties });
					}
				}
			}
		});

		return rules;
	};

	loadStyle('app');
	
	return {
		styles: styles,
		elements: els,
		
		get: getStyle,
		load: loadStyle,
		style: style,
		refresh: refreshStyles,
		extend: extendStyle
	};
};