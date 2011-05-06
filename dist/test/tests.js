(function(global){
	if (global.tests_enabled) {
		Ti.include('/test/lib/jasmine-1.0.2.js');
		Ti.include('/test/lib/jasmine-titanium.js');
		
		// Include all the test files
		Ti.include('/test/core.js');
		
		jasmine.getEnv().addReporter(new jasmine.TitaniumReporter());
		jasmine.getEnv().execute();
	}
})(this);