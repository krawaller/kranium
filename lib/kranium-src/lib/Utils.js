var expose = {
	isFunc: 'isFunc',
	get: 'get',
	set: 'set',
	alert: 'alert',
	log: 'log',
	pad: 'pad',
	loadify: 'loadify',
	doneify: 'doneify',
	notify: 'notify',
	l: 'l',
	/*isFunction: 'isFunction',
	isArray: 'isArray',
	type: 'type',
	isPlainObject: 'isPlainObject',
	isTiObject: 'isTiObject',
	extend: 'extend',*/
	stringify: 'stringify'
};
exports.__expose = expose;

var androidIndicator;
exports.Utils = function(K, global){
	
	var Utils = {
		isFunc: function(obj){ return toString.call(obj) === "[object Function]"; },


		get: function(key){ 
			var str = Ti.App.Properties.getString(key);

			try {
				return str != null ? JSON.parse(str) : null;
			} catch(e){
				return str;
			}
		},

		set: function(key, val){ 
			return Ti.App.Properties.setString(key, JSON.stringify(val)); 
		},

		alert: function(message, title){
			Ti.UI.createAlertDialog({
		        title: title || 'Obs!',
		        message: message
		    }).show();
		},

		log: function(){
			var args = Array.prototype.slice.call(arguments, 0),
				out = (args.length > 1 ? args : args[0]);
			
			try {	
				Ti.API.log("Kranium", K.is.android ? JSON.stringify(out) : out);
			} catch(e){
				//Ti.API.log("Kranium", out);
			}
		},
		
		pad: function(num, totalChars) {
		    var pad = '0';
		    num = num + '';
		    while (num.length < totalChars) {
		        num = pad + num;
		    }
		    return num;
		},
		
		loadify: function(el, fn, msg, modal){
			var done;
			if(K.is.ios){
				var p = (el && el._p) || el || GLOBAL.win || Ti.UI.currentWindow;

				if(!p){ return; }

				if(modal){
					p = el._p = K.isTiObject(el) ? el : K(typeof el === 'string' ? el : 'tabgroup').get(0);
				} 

				if(p && !p._loader){
					p._loader = K.createActivityIndicator({
						className: (modal ? 'modalLoader' : 'loader') + ' ' + (modal ? 'modalLoader' : 'loader') + (p._type === 'tabgroup' ? 'TabGroup' : 'Window')
						//message: modal ? msg : '',
						//width: 'auto'
					});

					p && p.add(p._loader);
					p._loader.message = msg;
			        p._loader.show();
			        p._loader.message = null;
			        p._loader.hide();
				}

				p._loader.message = msg || null;
				p._loader.show();

			} else {
				androidIndicator = androidIndicator || Titanium.UI.createActivityIndicator();
				androidIndicator.message = msg;
				androidIndicator.show();
			}

			if(fn){ // Test if func
				done = function(){ K.doneify(el); };
				if(typeof fn(done) !== 'undefined'){
					done();
				}
			}
		},

		doneify: function(el){
			if(K.is.ios){
				var p = (el && el._p) || (el && el._type && el) || (K(typeof el === 'string' ? el : 'tabgroup').get(0)) || GLOBAL.win || Ti.UI.currentWindow;
				p && p._loader && setTimeout(p._loader.hide, 500);
			} else {
				if(androidIndicator && androidIndicator.hide){
					androidIndicator.hide();
				}
			}
		},
		
		// Notification popups
		notify: (function(){

			function show(){
				messageView.opacity = 0;
				messageView.show();
				messageView.animate({ opacity: 0.95, duration: 500 });
			}

			function hide(){
				messageView.animate({ opacity: 0, duration: 500 }, function(){
					messageView.hide();
				});
			}

			var messageLabel, messageView;
			return function(msg){
				if(K.is.ios){
					if(!messageLabel){
						messageLabel = K.createLabel({
							className: 'notificationLabel',
							text: msg
						});
					}

					if(!messageView){
						messageView = K.createView({
							className: 'notification',
							visible: false,
							children: [{
								type: 'view',
								className: 'notificationBody',
								children: [messageLabel]
							},
							{
								type: 'view',
								className: 'notificationShadow'
							}],
							click: hide
						});

						K('tabgroup').append(messageView);
					}

					messageView.height = Math.ceil(msg.length/32) * 20 + 20;
					messageLabel.text = msg;
					show();

					setTimeout(hide, 5000);
				} else {
					Ti.UI.createNotification({
						message: msg,
						duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
						offsetX: 0,
						offsetY: 30
					}).show();
				}

			};

		})(),
		
		// Enhanced localization
		l: (function(){
			var cache = {};
			return function(key, hint, obj, modifier){
				if(cache[key]){
					return cache[key];
				}

				modifier = modifier || function(s){ return s; };
				if(typeof hint === 'object'){
					obj = hint;
					hint = null;
				}

				var doCache = true,
					ret = ((Titanium.Locale.getString(key, hint || key) || '').replace(/(^|[^\w\d])@([A-Za-z_\-]+)\b/g, function($0, $1, name){
						doCache = false;
						return ($1||'')+modifier(obj && typeof obj[name] !== 'undefined' ? obj[name] : Titanium.Locale.getString(name));
					}));

				if(doCache){
					cache[key] = ret;
				}

				return ret;
			};
		})(),
		
		
		Number: {
			round: function(number, n){
				var n = n || 0, pow = Math.pow(10, n);
				return (Math.round(number * pow) / pow).toFixed(n >= 0 ? n : 0);
			}
		},
		
		Array: {
			remove: function(arr, elem, max) {
		        var index, i = 0;
		        while((index = arr.indexOf(elem)) != -1 && (!max || i < max)) {
		            arr.splice(index, 1);
		            i++;
		        }
		        return arr;
		    },
		
			pluck: function(arr, prop){
				return arr.map(function(o){ return o[prop]; });
			}
		}
		
		
	};
	
	
	/*!
	TiObject stringifier is based heavily on code from @rem's JSConsole, which has the following license

	Copyright (c) 2010 Remy Sharp, http://jsconsole.com

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

	
	var reTiObject = /^\[object Ti/;

	function sortci(a, b) {
		return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
	}

	function stringify(o, simple) {
		var json = '',
			i, type = ({}).toString.call(o),
			parts = [],
			names = [],
			ownType = o && o.toString && o.toString();

		if (type == '[object String]') {
			json = '"' + o.replace(/"/g, '\\"') + '"';
		} else if (type == '[object Array]') {
			json = '[';
			for (i = 0; i < o.length; i++) {
				parts.push(stringify(o[i], simple));
			}
			json += parts.join(', ') + ']';
			json;
		} else if (o === null) {
			json = 'null';
		} else if (o === undefined) {
			json = 'undefined';
		} else if (ownType && reTiObject.test(ownType)) {
			json += ['"', "<", (o._type || 'unknown'), (o._id ? " id='" + o._id + "'" : ""), o.className ? " class='" + o.className + "'" : "", ">", ((tmp = (o.text || o.title || "")) ? tmp : ''), "</" + (o._type || 'unknown') + ">", '"'].join("");
		} else if (type == '[object Object]') {
			json = '{';
			for (i in o) {
				names.push(i);
			}
			names.sort(sortci);
			for (i = 0; i < names.length; i++) {
				parts.push(stringify(names[i]) + ': ' + stringify(o[names[i]], simple));
			}
			json += parts.join(', ') + '}';
		} else if (type == '[object Number]') {
			json = o + '';
		} else if (type == '[object Boolean]') {
			json = o ? 'true' : 'false';
		} else if (type == '[object Function]') {
			json = o.toString();
		} else if (simple == undefined) {
			json = type + '{\n';
			for (i in o) {
				names.push(i);
			}
			names.sort(sortci);
			for (i = 0; i < names.length; i++) {
				parts.push(names[i] + ': ' + stringify(o[names[i]], true)); // safety from max stack
			}
			json += parts.join(',\n') + '\n}';
		} else {
			try {
				json = o + ''; // should look like an object      
			} catch(e) {}
		}
		return json;
	}

	Utils.stringify = stringify;
	
	return Utils;
};