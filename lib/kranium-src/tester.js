(function(global){
	if(global.TEST){
		K.log('Testing activated! :-O');
		Ti.App.addEventListener('filechange', test);

		Ti.include('/test/lib/jasmine-1.0.2.js');
		Ti.include('/test/lib/jasmine-titanium-node.js');

		function test(){
			jasmine.currentEnv_ = null;
			jasmine.getEnv().addReporter(new jasmine.TitaniumNodeReporter());

			win = Ti.UI.createWindow({ width: 100, height: 100, backgroundColor: '#ccc', left: -200, opacity: 0.8 });
			win.open();
			Ti.App.addEventListener('filechange', function(){ win.close(); });

			q = function(str){
				return (Array.prototype.slice.call(arguments).join(", ")).split(/\s+,\s+/g).map(function(id){ return getElementById(id); });
			};

			// Include all the test files
			Ti.include('/test/demo.js');
			jasmine.getEnv().execute();
		}
		test();
	}
})(this);