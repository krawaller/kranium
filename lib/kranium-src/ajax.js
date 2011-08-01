/**
 * Define AJAX module
 */


(function(global){

    /**
     * Default AJAX settings
     */
	var noop = function(){}, 
		ajaxDefaults = {
		cache: true,
		data: {},
		error: function(){},
		defError: function(e){
			Ti.API.error(['xhr', this.opts]);
			var a = Ti.UI.createAlertDialog({
				buttonNames: ['Försök igen','Avbryt'],
				cancel: 1,
				title: 'Kommunikationsfel',
				message: "Kunde ej nå server. \nKolla din uppkoppling och försök igen!"
			});
			var xhr = this;
			a.addEventListener('click', function(e){
				if(e.index == 0){
					K.ajax(xhr.inOpts);
				}
			});
			a.show();
		},
		appcacheAge: 360000000,
		appcache: false, // TODO - set this to false!!
		timeout: 30000,
		success: noop,
		type: 'GET',
		dataType: 'json'
		};

	/**
	 * Simplified ajax
	 *
	 * @param {Object} inOpts containing
	 * * type
	 * * dataType
	 * * data
	 * * success
	 * * error
	 * * timeout
	 * @returns {Ti.Network.HTTPClient} The resulting HTTPClient
	 */
	K.ajax = function(inOpts){
		var opts = K.extend(K.extend({}, ajaxDefaults), inOpts), 
			xhr = Ti.Network.createHTTPClient(opts), 
			data = K.extend(opts.data, opts.extendData || {}),
			loader = { _hide: function(){} },
			hash;
	
		if(opts.loader){
		
			//Ti.API.log('optsloader', K.stringify(opts.loader));
			var parent = (opts.loader._type ? opts.loader : K.currentWindow||Ti.UI.currentWindow);
			loader = parent._loader||K.createActivityIndicator({ className: 'loader' });
		
			if(!parent._loader){
			
				parent.add(loader);
				loader._show = function(){ loader.opacity = 0; loader.show(); loader.animate({ opacity: 0.7, duration: 300 }); }
				loader._hide = function(){ loader.animate({ opacity: 0, duration: 300 }, function(){ loader.hide(); }); }
				parent._loader = loader;
			}
			loader._show();
			Ti.API.log('showing loader');
		}
		xhr.inOpts = inOpts;
	
		if(!opts.url){
			loader._hide();
			return false;
		}
		 
		xhr.onload = function(){
			try {
				var text = typeof opts.preprocess === 'function' ? opts.preprocess(this.responseText) : this.responseText,
					response;
					
				switch (opts.dataType) {
					case 'json':
						try {
							response = JSON.parse(text);
						}
						catch(e){
							Ti.API.error(e);
							Ti.API.error(text);
							throw "WTF?!"+e;
						}
						break;
					
					default:
						response = text;
						break;
				}

			
				opts.success && opts.success.call(opts.context || xhr, response, xhr.status, xhr);
				loader._hide();
				
				opts.complete && opts.complete(xhr, ({200:'success',304:'notmodified'})[xhr.status]||'error');
			} 
			catch (e) {
				Ti.API.error(['onload error', e]);
			}
			opts.anyway && opts.anyway();
		};
		xhr.opts = opts;
		if (!opts.silent){
			xhr.onerror = function(e){
				opts.anyway && opts.anyway();
				loader._hide();
				if( (opts.error && opts.error(e) !== false) || !opts.error){ xhr.defError(e); }
			};
		}
		xhr.requestedAt = new Date().getTime();
		xhr.open(opts.type, opts.url + (!opts.cache ? '?' + new Date().getTime() : ''));
	
		opts.beforeSend && opts.beforeSend(xhr);
		opts.contentType && xhr.setRequestHeader('Content-Type', opts.contentType);
		var name;
		if(opts.headers){
			for(name in opts.headers){
				xhr.setRequestHeader(name, opts.headers[name]);
			}
		}
		xhr.send(data);
		return xhr;
	};

	/**
	 * Change default AJAX settings
	 *
	 * @param {Object} opts containing any or all of
	 * * type
	 * * dataType
	 * * data
	 * * success
	 * * error
	 * * timeout
	 */
	K.ajaxSetup = function(opts){ K.merge(ajaxDefaults, opts); };

	/**
	 * YQL service path
	 */
	var yqlStart = 'http://query.yahooapis.com/v1/public/yql',
		yqlEnd = '&format=json&callback=';
	
	/**
	 * YQL interface
	 *
	 * @param {Object} opts containing
	 * * q
	 * * params
	 * * success
	 * * error
	 * * timeout
	 * @returns {Ti.Network.HTTPClient} The resulting HTTPClient
	 */	
	
	K.yql = function(opts){
		opts.url = yqlStart;
		opts.data = ('format=json&callback=&diagnostics=true&q=' + opts.q).esc(opts.params, encodeURIComponent).toString();
		opts.type = 'POST';
		opts.headers = {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
		};
		return K.ajax(opts);
	};

})(this);