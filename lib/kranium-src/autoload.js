(function(){
	var K = {};
	var modules = ['echo'];

	modules.forEach(function(moduleName){
		Object.defineProperty(K, moduleName, {
			get: function() {
				var exports = require(moduleName)[moduleName];
				delete K[moduleName];
				K[moduleName] = exports;
				return exports;
			},
			enumerable: true,
			configurable: true
		});
	});

	var res = K.echo.echo("hej");
	Ti.API.info(' ==================================== K.echo.echo("hej"): ' + res);
	Ti.UI.createAlertDialog({
		title: 'woot',
		message: res
	}).show();
	
})();