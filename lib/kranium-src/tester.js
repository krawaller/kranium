(function(global){

	if(global.TEST){
		Ti.App.addEventListener('filechange', test);

		Ti.include('/test/lib/jasmine-1.0.2.js');
		Ti.include('/test/lib/jasmine-titanium-node.js');

		function test(){
			jasmine.currentEnv_ = null;
			jasmine.getEnv().addReporter(new jasmine.TitaniumNodeReporter());

			win = Ti.UI.createWindow({ width: 100, height: 100, backgroundColor: '#ccc', left: -200, opacity: 0.8 });
			win.open();
			Ti.App.addEventListener('filechange', function(){ win.close(); });

			Ti.include('/assets/k2.js');
			q = function(str){
				return (Array.prototype.slice.call(arguments).join(", ")).split(/\s+,\s+/g).map(function(id){ return getElementById(id); });
			};

			// Include all the test files
			//Ti.include('/test/core.js');
			Ti.include('/test/traversing.js');
			jasmine.getEnv().execute();

			Ti.include('classtest.js');

		}
		test();
	}
})(this);