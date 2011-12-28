//
// don't use this example code, the file paths are wrong. 
// see the tests for cut and paste if you're feeling lazy.
//
var Codesurgeon = require('codesurgeon').Codesurgeon;
var surgeon = new Codesurgeon({
	quiet: true
});    // make an instance

var out = {};
[
	"Ajax.js",
	"AndroidShim.js",
	"BackboneIntegration.js",
	"Class.js",
	"Color.js",
	"Core.js",
	"Database.js",
	"Extend.js",
	"ExtendNatives.js",
	"File.js",
	"Jade.js",
	"JadeLoader.js",
	"Live.js",
	"SelectorEngine.js",
	"Settings.js",
	"Style.js",
	"Tester.js",
	"UI.js",
	"Utils.js"
].forEach(function(name){
	var output = surgeon
		.clear()
			.read('lib/kranium-src/lib/' + name)
				.extract('expose')
					.output
					.replace(/var\s+/g, '')
					.replace(/;\s*$/, '')
					.trim();
	
	//console.log('output', output);
	if(output && output.length > 1){
		try {
			var obj = eval('(' + output + ')');
			//console.log(obj);
			if(obj){
				out[name.replace('.js', '')] = obj;
			}
		} catch(e){
			console.log('err', e);
		}
		
	}	
	
})

console.log(JSON.stringify(out));
