(function(global){
	if (global.tests_enabled) {
		Ti.include('/kranium/lib/test/jasmine-1.0.2.js');
		Ti.include('/kranium/lib/test/jasmine-titanium-node.js');
		
		// Include all the test files
		Ti.include('/test/core.js');
		
		jasmine.getEnv().addReporter(new jasmine.TitaniumNodeReporter());
		jasmine.getEnv().execute();
	}
})(this);