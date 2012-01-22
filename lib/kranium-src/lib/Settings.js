exports.__expose = {
	settings: '__alias'
};

exports.Settings = function(K, global){
	return {
		useCustomAndroidNavBar: false //K.is.android
	};
};