var sys = require('util'),
	fs = require('fs'),  
	colors = require('colors'),
	http = require('http'),
	connect = require('connect'), 
	net = require('net'),
	io = require('socket.io'),                                                              
	stylus = require('stylus'),
	less = require('less'),
	coffee = require('coffee-script'),
	async = require('async'),
	flag = './.monitor',
	growl = require('growl'),
	url = require('url'),
	path = require('path'),
	exec = require('child_process').exec,
	
	l = require('../utils').log;

if(!path.existsSync(flag)){
	fs.writeFileSync(flag, '');
}

var client, server;
function watch(opts){
	'Start watching'.log();
	
	// Create server
	var interval = setInterval(processChanges, 100),
		appsocket = net.createServer(function(stream) {
	    stream.setEncoding('utf8');
	    stream.on('connect', function() {
	        _stream = stream;
	        'App connected - sending files'.log();

			/*fs.writeFileSync(flag, '');
			getFiles('all', function(err, files){
				processFiles(err, files, function(err, res){
					if(res && res.length){
						stream.write(JSON.stringify({
				            action: 'files',
				            files: res
				        })+appDelimiter);
					}
				});
			});*/
			if(!interval){
				interval = setInterval(processChanges, 100);
			}
			
	    });

	    stream.on('data', function(data) {
	        framer.next(data).forEach(parseFrame);
	    });

	    stream.on('end', function() {
			'App disconnected'.log();
	        stream.end();
	        clearInterval(interval);
			interval = null;
			stream = null;
	    });
	});
	appsocket.listen(8128);
	'Server running, please start application!'.log();
	
	var server = connect.createServer(
		connect.static(__dirname + './../jsconsole')
	);
	server.listen(3333);
	
	socket = io.listen(server); 
		
	socket.on('connection', function(_client) {
		client = _client;
		// new client is here!
		console.log('connect');
		client.on('message', function(o) {
			switch(o.action){
				case 'cmd':
					appwrite({ action: 'cmd', cmd: o.cmd });
					//client.send({ action: 'res', res: eval('('+o.cmd+')') });
					break;
			}
		});
		client.on('disconnect', function() {
			console.log('disc');
		});

	});
};

module.exports = watch;


var fileTypes = "js jss kss styl less coffee".split(" "),
	fileTypesFlags = fileTypes.map(function(ext){ return '-name "*.'+ext+'"'; }).join(" -o "),
	findAll = 'find Resources -type f \\( '+fileTypesFlags + ' \\)',
	findChanged = 'find Resources -type f -newer '+flag+' \\( '+fileTypesFlags + ' \\)',
	cmdByType = { "new": findChanged, "all": findAll },
	whitelist = [
		'Resources/kranium-generated-bootstrap.js',
		'Resources/test/test/lib/jasmine-1.0.2.js',
		'Resources/test/test/lib/jasmine-titanium-node.js',
		'Resources/test/test/lib/jasmine-titanium.js'
	];

function getFile(filename, callback){
	fs.readFile(filename, function(err, data){
		callback(null, { name: filename, content: (data||'').toString() });
	});
}

function getFiles(type, callback){
	var cmd;
	if((cmd = cmdByType[type])){
		//console.log('using', cmd);
		exec(cmd, function(error, stdout, stderr){
			//console.log(stdout);
			var files = stdout.split(/[\r\n]/g).filter(function(o){ return !!o && whitelist.indexOf(o) === -1; });
			//console.log(Date.now(), files);
			async.map(files, getFile, callback);
		});
	}
}	

// From the nodejs mailing list
var Framer = function(delimiter) { 
  this.delimiter = delimiter ? delimiter : "\0"; 
  this.buffer = []; 
}; 

Framer.prototype.next = function(data) { 
  var frames = data.split(this.delimiter, -1); 
  this.buffer.push(frames.shift()); 
  if(frames.length > 0) { 
      frames.unshift(this.buffer.join('')); 
      this.buffer.length = 0; 
      this.buffer.push(frames.pop()); 
  } 
  return frames; 
};

var framer = new Framer(),
    watchingFiles = {},
    _stream,
	appDelimiter = "ZOMG"+"KRAWALLERROCKS";

// Parse a frame and take action
function parseFrame(frame){
    var o = JSON.parse(frame);
	switch(o.action){
		case 'res':
			client.send({ action: 'res', res: o.res });
			break;
			
		case 'puts':
		case 'print':
		
			sys[o.action](o.msg);
			break;
			
		case 'notify':
			var opts = {};
			if(o.title){ opts.title = (o.title||"").replace(/([\(\)])/g, '\\$1'); }
			growl.notify(o.msg, opts);
			break;
	}
}

function pumpFileChange(file, content){
	try {
 	   _stream && _stream.write(JSON.stringify({
            action: 'filechange',
            file: file,
            content: content
        })+appDelimiter);
	} catch(e){ console.log('write error', e); }
	file.magenta.log('updated');
}

function appwrite(o){
	try {
 	   _stream && _stream.write(JSON.stringify(o)+appDelimiter);
	} catch(e){ console.log('write error', e); }
}

function processFiles(err, files, callback){
	async.map(files, function(o, callback){
		var filename = o.name,
			ext = filename.match(/[^\.]+$/)[0];
		
		switch(ext){
			case 'styl':
				stylus.render(o.content, { filename: filename }, function(err, css){
					if (err) { console.log(err); return callback(null, null); }
					
					var kssfile = filename.replace(/styl$/, 'kss');
					fs.writeFileSync(kssfile, css);
					return callback(null, { name: filename.replace(/styl$/, 'kss'), content: css });
				});
				break;
				
			case 'less':
				less.render(o.content, function (err, css) {
					if (err) { console.log(err); return callback(null, null); }
					
					var kssfile = filename.replace(/less$/, 'kss');
					fs.writeFileSync(kssfile, css);
					return callback(null, { name: kssfile, content: css });
				});
				break;
				
			case 'coffee':
				var js, jsfilename;
				try {
					js = coffee.compile(o.content);
					//fs.writeFileSync(jsfile, js);
					//pumpFileChange(jsfile, js);
				} catch(err){ console.log(err); return callback(null, null); }
				
				var jsfilename = filename.replace(/coffee$/, 'js');
				fs.writeFileSync(jsfilename, js);
				return callback(null, { name: jsfilename, content: js });
				break;
				
			default:
				return callback(null, { name: filename, content: o.content });
				break;
		}
	}, callback);
}

function processChanges(){
	getFiles('new', function(err, files){
		if(files && files.length){			
			fs.writeFileSync(flag, '');
			processFiles(err, files, function(err, res){
				(res||[]).forEach(function(o){
					if(o){
						pumpFileChange(o.name, o.content);
					}	
				});
			});
		}
	});
}