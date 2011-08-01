/**
 * Define live module
 */

(function(global) {

	K.reset = function() {
		K.elsByClassName = {};
		K.elsById = {};
		K.elsByName = {};
		uuid = win._uuid = 1;
	};
	K.reset();

	function cleanse(s) {
		return (s || '').replace(/[<>&]/g, function(m) {
			return {
				'&': '&amp;',
				'>': '&gt;',
				'<': '&lt;'
			} [m];
		});
	}

	var Framer = function(delimiter) {
		this.delimiter = delimiter ? delimiter : "\0";
		this.buffer = [];
	};

	Framer.prototype.next = function(data) {
		var frames = data.split(this.delimiter, -1);
		this.buffer.push(frames.shift());
		if (frames.length > 0) {
			frames.unshift(this.buffer.join(''));
			this.buffer.length = 0;
			this.buffer.push(frames.pop());
		}
		return frames;
	};

	var framer = new Framer("ZOMG" + "KRAWALLERROCKS");

	/**
	 * Start watching for file changes to be piped from nodejs server
	 * @param host Host for server
	 * @param port Port for server. Default is 8128
	 * @param win Window to add 'close' listener to for cleaning up socket
	 */
	Ti.App.Properties.setBool('_watching', false);
	K.watch = function(host, port) {
		K.log('starting livetanium');
		// Only open one connection, preferrably from app.js
		if (Ti.App.Properties.getBool('_watching')) {
			return false;
		}
		Ti.App.Properties.setBool('_watching', true);

		var watchers = {},
			Watcher = {
			watch: function(file, callback, e) {
				if (!watchers[file]) {
					socket.write(JSON.stringify({
						action: 'watch',
						file: file
					}));
					watchers[file] = e.source;
				}
			}
		};

		var socket = Titanium.Network.createTCPSocket({
			hostName: host,
			port: port,
			mode: Titanium.Network.READ_WRITE_MODE
		});

		function parseFrame(frame) {
			try {
				var o = JSON.parse(frame);

				switch (o.action) {
					case 'cmd':
						var res;
						try {
							res = eval('(' + o.cmd + ')');
						} catch(e) {
							res = e;
						}
						socket.write(JSON.stringify({
							action: 'res',
							res: cleanse(K.stringify(res)).replace(/[\u007F-\uFFFF]/g, function(a){ return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4) })
						}));
						break;

					case 'filechange':
						// Upon filechange, call all applicable listening contexts
						Ti.App.fireEvent('filechange', { name: o.file });
						try {
							var name = o.file.replace(/^\.?\//, function($0) {
								return '';
							}).replace(/\//g, '-'),
								path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
								h = Ti.Filesystem.getFile(path, name);

							h.write(o.content);
						} catch(e) {
							Ti.API.error(e);
						}

						var m = o.file.match(/[^.]+$/); // Get file extension
						switch (m && m[0]) {
							case 'kss':
							case 'jss':
								K.log('Applying live styles from: "' + o.file + '"');
								
								K.style(null, o.content, true);
								
								/*var tree = K.buildSelectorTree(o.content);
								tree.forEach(function(rule) {
									//Ti.API.log('procel', [rule.selector, K(rule.selector)]);
									K(rule.selector).each(function() {
										var el = this;
										//Ti.API.log('el', el); 
										rule.properties.forEach(function(o) {
											el[o.property] = o.value;
										});
									});
								});*/
								break;

							case 'js':
								if (/kui\//.test(o.file)) {
									var req = eval('try { var exports = {}; ' + o.content + '; exports.Class; } catch(e){ Ti.API.error(e); }'),
										type;
									
									K.log('Trying to live update "'+o.file+'". If this explodes, run "kranium watch --nolivejs" instead')
									if (req && (type = (o.file.match(/([^\/]+)\.js$/) || [false, false])[1])) {
										var klass = K.classes[type] = K.loadClass(type, req);
										K('.' + type).each(function() {
											//Ti.API.log('oldprops', this._props);
											
											var old = this,
												index,
												n = new klass(old._props).el;

											if (n._type == 'window') {
												K(old.children).each(function() {
													K(this).remove();
												});

												/*if ((index = K.elsByName[old._type].indexOf(old)) != -1) {
													K.elsByName[old._type].splice(index, 1);
												}*/

												var $old = K(old);
												K(n.children).each(function() {
													$old.append(this);
												});
												//Ti.API.log('children', n.children);
											} else {
												var parent = old.getParent();
												K(old).remove();
												
												/*if ((index = K.elsByName[old._type].indexOf(old)) != -1) {
													K.elsByName[old._type].splice(index, 1);
												}*/

												K(parent).append(n);
											}
											//Ti.API.log('n', n);
										});
									}
								}
							break;
						}
						break;

					case 'files':
						// Write all files to app tmp directory on startup
						Ti.API.info('Socket connected - receiving files');
						o.files.forEach(function(f, i) {
							var name = f.name.replace(/\.\//, function($0) {
								return '';
							}).replace(/\//g, '-'),
								path = Ti.Filesystem.tempDirectory.replace(/\/$/, ''),
								h = Ti.Filesystem.getFile(path, name);

							h.write(f.content);
						});
						break;

					case 'message':
						Ti.API.info('Socket message', o.message);
						break;
				}
			} catch(e) {
				Ti.API.error(e);
			}
		}

		socket.addEventListener('read', function(e) {
			//Ti.API.log('inserting into frame', e.data.text);
			framer.next(e.data.text).forEach(parseFrame);
		});
		
		socket.addEventListener('close', function(e) {
			K.log('socket closed');
		});

		Ti.App.addEventListener('close', function(e) {
			if (socket.isValid) {
				Ti.API.log('close socket');
				socket.close();
			}
		});

		socket.connect();
		socket.write(JSON.stringify({
			action: 'echo',
			message: 'Socket connected'
		}));
		
		global.socketwrite = function(msg, type){ socket.write(JSON.stringify({ action: type, msg: msg })); };
		global.customsocketwrite = function(o){ if(!o.action){ return; } socket.write(JSON.stringify(o)); };
		
		var log = K.log;
		K.log = function(){
			var args = Array.prototype.slice.call(arguments);
			log.apply(log, args);
			try {
				socket.write(JSON.stringify({
					action: 'res',
					res: cleanse(K.stringify(args.length === 1 ? args[0] : args))
				}));
			} catch(e){ Ti.API.error(e); }
		};
	};

})(this);
