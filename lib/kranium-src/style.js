(function(global){

	var styles = K.styles = {};
	K.extendStyle = K.addStyle = function(opts){
		K.extend(styles, opts || {});
	};

	// The current window - added to K._els to achieve immediate styling
	var thisWindow = (Ti.UI.currentWindow || global.win) || {};
	thisWindow._type = 'window';

	var els = K._els = K._els || [thisWindow];
	var styleCache = {};

	/**
	 * Calculating style for object
	 * @param opts Object containing options OR String containing selector
	 * @param type String type of object
	 * @return Object of calculated style 
	 */
	var getStyle = K.getStyle = function(opts, type){
		var i;
		if(typeof opts === 'string'){ opts = { className: opts }; }
		var elStyle, c, hash = type+(opts && opts.cls+opts.className);
		if (!(elStyle = styleCache[hash])) {
			elStyle = styles[type] ? extend({}, styles[type]) : {};
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
	K.refreshStyles = function(styleString, _els){
		if(styleString){
			styleCache = {};
			K.style(null, styleString);
		} 
		(_els ? (Array.isArray(_els) ? _els : [_els]) : els).forEach(function(el){
			var s = K.getStyle(el, el._type), p;
			for(p in s){
				el[p] = s[p];
			}
		});	
	};

	/**
	 * Parse and apply styles found in specified file or in call
	 * @param file Filename containing styles. Optional
	 * @param str String containing styles. Optional
	 */
	var rEvalProp = /^(=)?(Ti|Titanium)?/;
	K.style = function(file, str, applyStyles){
		try {
			if(!str){
				/*var h = file && Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, file.substring(1).replace(/\//g, '-')),
					tmp = h && h.exists && (h.read() || {}).text;
				
				str = tmp || Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, file).read().text;*/
				str = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file).read().text;
			}
			var selectors = K.buildSelectorTree(str), m, val, prop, camelized;
			(selectors || []).forEach(function(sel){
				var obj = styles[sel.selector] = styles[sel.selector] || {};
				sel.properties.forEach(function(prop){
					m = prop.value.match(rEvalProp);
					value = prop.value;
					property = prop.property.trim();
					
					//Ti.API.log('property', { property: property, hascamel: !!property.toCamel })
				
					//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', m]);

					if(m && m[0]){
						//Ti.API.log('rule', ['>'+value+'<', '>'+property+'<', eval('('+value.substring((m[1] && m[1].length) || 0)+')')]);
						obj[property] = eval('('+value.substring((m[1] && m[1].length) || 0)+')');
					} else {
						switch((camelized = property.toCamel())){
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
									Ti.API.log('grad', JSON.stringify(obj.backgroundGradient));
									//Ti.API.log('OBJ', [gradientType, colors]);
								break;	
							
							default:
								if(camelized == 'backgroundImage'){ Ti.API.log('info', JSON.stringify(value)); }
								obj[camelized] = value;
								break; 
						}
					}
				});
				
				if(applyStyles){
					K(sel.selector).each(function() {
						var el = this;
						for(var property in obj){
							el[property] = obj[property];
						}
					});
				}
				
			});
		
			K.refreshStyles(); // Refresh styles
		} catch(e){ Ti.API.log('style apply error', e); }
	};

	K.loadStyle = function(filename){
		var contents, tmp, path = 'kss/' + filename + '.kss';
		K.log('Loading styles for ' + filename);
		if( (contents = K.file('res://'+path)) ){
			K.style(null, contents);
		}
	};

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

	var WHITESPACE_CHARACTERS = /\t|\n|\r/g,
		EMPTY_STRING = "",
		PLACEHOLDER_STRING = "$1",
		END_MUSTACHE = "}",
	
		// Minification optimizations
		TRUE = true,
		FALSE = false,
		NULL = null,
		UNDEFINED = undefined;

	K.buildSelectorTree = function(text) {
		var rules = [], ruletext, rule,
			match, selector, proptext, splitprop, properties, sidx, prop, val;

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

					if (selector && properties.length) {
						rules.push({ selector : selector, properties : properties });
					}
				}
			}
		});

		return rules;
	};

	K.loadStyle('app');

})(this);