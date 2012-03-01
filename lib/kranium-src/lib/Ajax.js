var expose = {
	ajax: 'ajax',
	ajaxSetup: 'ajaxSetup',
	post: 'post',
	getJSON: 'getJSON',
	yql: 'yql'
};

exports.__expose = expose;

exports.Ajax = function(K, global){

	var Ajax = {};

    /**
     * Default AJAX settings
     */
	var noop = function(){}, 
		ajaxDefaults = {
		cache: true,
		data: {},
		error: function(e, opts){
			K.createAlertDialog({
				buttonNames: [K.l('try_again'), K.l('cancel')],
				cancel: 1,
				title: K.l('communication_error'),
				message: K.l('communication_error_description'),
				click: function(e){
					if(e.index == 0){
						K.ajax(opts);
					}
				}
			}).show();
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
	Ajax.ajax = function(inOpts){
		var opts = K.extend(K.extend({}, ajaxDefaults), inOpts);
		
		var _error = opts.error;
		opts.error = function(e){
			_error.call(this, e, opts);
		};
		
		var	xhr = Ti.Network.createHTTPClient(opts), 
			data = typeof opts.data === 'object' ? K.extend(opts.data, opts.extendData || {}) : opts.data,
			loader = { 
				_hide: function(){
					K.doneify(opts.loader);
				}, 
				_show: function(){
					K.loadify(opts.loader, null, opts.loaderMessage || (K.is.android ? K.l('loading') : ''), !!(opts.loaderModal || opts.loaderMessage), function(){ 
						
						K.doneify(opts.loader);
						K.notify(opts.cancelMessage);
						xhr._aborted = true;
						xhr.abort();
						
					});
				} 
			},
			hash;
	
		if(opts.loader){
			loader._show();
		}
		xhr.inOpts = inOpts;
	
		if(!opts.url){
			loader._hide();
			return false;
		}
		 
		xhr.onload = function(){
			try {
				if(Number(xhr.status.toString()[0]) > 3){
					this.error && this.error.call(xhr, null);
				} else {
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
							}
							break;

						default:
							response = text;
							break;
					}


					opts.success && opts.success.call(opts.context || xhr, response, xhr.status, xhr);
					opts.complete && opts.complete(xhr, ({200:'success',304:'notmodified'})[xhr.status]||'error');
				}

				loader._hide();
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
				opts.error && opts.error(e);
				//if( (opts.error && opts.error(e) !== false) || !opts.error){ xhr.defError(e); }
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
	Ajax.ajaxSetup = function(opts){ K.merge(ajaxDefaults, opts); };

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
	
	Ajax.yql = function(opts){
		opts.url = yqlStart;
		opts.data = ('format=json&callback=&diagnostics=true&q=' + opts.q).esc(opts.params, encodeURIComponent).toString();
		opts.type = 'POST';
		opts.headers = {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
		};
		return Ajax.ajax(opts);
	};
	
	// From Zepto
	/*$.get = function(url, success) {
		$.ajax({
			url: url,
			success: success
		})
	};*/
	Ajax.post = function(url, data, success, dataType) {
		if ($.isFunction(data)) dataType = dataType || success,
		success = data,
		data = null;
		Ajax.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: dataType
		});
	};
	Ajax.getJSON = function(url, success) {
		Ajax.ajax({
			url: url,
			success: success,
			dataType: 'json'
		})
	};

	return Ajax;
};