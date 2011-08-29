var fs = require('fs'),
	path = require('path'),
	_ = require('nimble'),
	flag = './.monitor',
	uglify = require('uglify-js'),
	sys = require('sys'),
	ghm = require("github-flavored-markdown"),
	exec = require('child_process').exec;
	
	parts = [
		"license",
		"core",
		"settings",
		"utils",
		"qsa", 
		"klass",
		"file",
		"style", 
		"create",
		"ajax", 
		"live", 
		"stringify",
		//"libs",
		//"backboneintegration",
		"end",
		"tester",
		"jade-loader",
		"androidshim"
	];

var fileTypes = "js md".split(" "),
	fileTypesFlags = fileTypes.map(function(ext){ return '-name "*.'+ext+'"'; }).join(" -o "),
	findAll = 'find lib/kranium-src/ -type f \\( '+fileTypesFlags + ' \\)',
	findChanged = 'find lib/kranium-src/ -type f -newer '+flag+' \\( '+fileTypesFlags + ' \\)',
	cmdByType = { "new": findChanged, "all": findAll };

function watch(fn, params){
	var type = 'new';
	fn(params, function(){
	
		fs.writeFileSync(flag, '');
		setInterval(function(){
			if((cmd = cmdByType[type])){
				exec(cmd, function(error, stdout, stderr){	
					var files = stdout.split(/[\r\n]/g).filter(function(o){ return !!o; });
					if(files.length){
						fs.writeFileSync(flag, '');
						fn(params);
					}
				});
			}
		}, 100);
		console.log('=> Watching for changes to src catalog...');
	
	});
}

desc('Create K-library from parts');
task('build', [], function(params) {
	fs.renameSync('dist', 'dist-' + Date.now());
	fs.mkdirSync('dist', 0777);
	
	watch(function(params, done){
		_.map(parts, function(part, callback){ fs.readFile('lib/kranium-src/' + part + '.js', callback); }, function(err, res){
			var contents = res.map(function(b, i){ return ('/*** ' + parts[i].toUpperCase() + ' ***/\n') + b.toString() }).join("\n\n");
			console.log('updating!');
			
			// Inject version automagically!
			//return JSON.parse(fs.readFileSync(require.main.filename.replace(/[^\/]+$/, 'package.json'))).version;
			
				
			fs.writeFileSync('dist/kranium.js', contents);
			
			
			/*var ast = uglify.parser.parse(contents);
			ast = uglify.uglify.ast_mangle(ast);
			ast = uglify.uglify.ast_squeeze(ast);
			
			fs.writeFileSync('../k2.min.js', uglify.uglify.gen_code(ast));*/
			
			done && done();
		});
	}, params);
	
	fs.writeFileSync('dist/kranium-jade.js', fs.readFileSync('lib/kranium-src/jade.js'));
	require('child_process').spawn('cp', ['-r', 'lib/kranium-src/kss', 'dist/kss']);
	require('child_process').spawn('cp', ['-r', 'lib/kranium-src/images', 'dist/images']);
	//require('child_process').spawn('cp', ['-r', 'lib/kranium-src/backbone', 'dist/backbone']);
	require('child_process').spawn('cp', ['-r', 'lib/kranium-src/test', 'dist/test']);
});

desc('Create annotated source docs');
task('annotate-source', [], function(params) {
	var cmd = 'dox --title Kranium --desc "This is the annotated source of the Kranium library" ' + parts.map(function(p){
		return 'lib/kranium-src/' + p + '.js';
	}).join(" ") + ' > docs/annotated-source.html';
	
	//console.log(cmd);
	
	exec(cmd, function(error, stdout, stderr){
		sys.puts(stderr); //console.log(error, stdout, stderr);
	});
});


desc('Create docs');
task('docs', [], function(params) {
	watch(function(params, done){
		
		var html = ghm.parse(fs.readFileSync('docs/site/site.md').toString());
		
		var str = [
		'<!DOCTYPE html>',
		'<html>',
		'<head>',
		  '<meta charset=utf-8>',
		  '<title>Kranium</title>',
		  '<meta name="description" content="Spine is a lightweight MVC framework for building JavaScript applications.">',
		  '<meta name="keywords" content="spine,javascript,mvc,framework,backbone,node,web,app">',
		  '<link rel="stylesheet" href="site/site.css" type="text/css" charset="utf-8">',
		  '<link rel="stylesheet" href="site/highlight.css" type="text/css" charset="utf-8">',
		  '<script src="site/jquery.js" type="text/javascript" charset="utf-8"></script>      ',
		  '<script src="spine.js" type="text/javascript" charset="utf-8"></script>      ',
		  '<script src="site/highlight.pack.js" type="text/javascript" charset="utf-8"></script>',
		  '<script type="text/javascript" charset="utf-8">',
		    'hljs.initHighlightingOnLoad();',
		  '</script>',
		'</head>',
		'<body>',
		'<div id="container">'+html+'</div>',
		'</body>',
		'</html>'
		];
		
		console.log('Updated!');
		fs.writeFileSync('docs/docs.html', str.join("\r\n"));
		done && done();
		
	}, params);
});