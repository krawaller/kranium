var fs = require('fs'),
	_ = require('nimble'),
	flag = './.monitor',
	uglify = require('uglify-js'),
	ghm = require("github-flavored-markdown"),
	exec = require('child_process').exec;

var fileTypes = "js md".split(" "),
	fileTypesFlags = fileTypes.map(function(ext){ return '-name "*.'+ext+'"'; }).join(" -o "),
	findAll = 'find . -type f \\( '+fileTypesFlags + ' \\)',
	findChanged = 'find . -type f -newer '+flag+' \\( '+fileTypesFlags + ' \\)',
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
						console.log('changed!', files);
						fn(params);
					}
				});
			}
		}, 100);
		console.log('=> Watching for changes to docs catalog...');
	
	});
}

desc('Create docs');
task('docs', [], function(params) {
	watch(function(params, done){
		
		var html = ghm.parse(fs.readFileSync('site/site.md').toString());
		
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
		fs.writeFileSync('docs.html', str.join("\r\n"));
		done && done();
		
	}, params);
});