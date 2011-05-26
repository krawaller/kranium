var fs = require('fs'),
	_ = require('nimble'),
	flag = './.monitor',
	uglify = require('uglify-js'),
	exec = require('child_process').exec;
	
	parts = [
		"core",
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
		"tester"
	];

var fileTypes = "js".split(" "),
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
	watch(function(params, done){
		_.map(parts, function(part, callback){ fs.readFile(part + '.js', callback); }, function(err, res){
			var contents = res.map(function(b, i){ return ('/*** ' + parts[i].toUpperCase() + ' ***/\n') + b.toString() }).join("\n\n");
			console.log('updating!');
			
			// Inject version automagically!
			//return JSON.parse(fs.readFileSync(require.main.filename.replace(/[^\/]+$/, 'package.json'))).version;
			
				
			fs.writeFileSync('../../dist/kranium.js', contents);
			
			/*var ast = uglify.parser.parse(contents);
			ast = uglify.uglify.ast_mangle(ast);
			ast = uglify.uglify.ast_squeeze(ast);
			
			fs.writeFileSync('../k2.min.js', uglify.uglify.gen_code(ast));*/
			
			done && done();
		});
	}, params);
});