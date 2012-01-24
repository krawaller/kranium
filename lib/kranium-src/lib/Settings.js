exports.__expose = {
	settings: '__alias'
};

exports.Settings = function(K, global){
	return {
		useCustomAndroidNavBar: K.is.android
	};
};