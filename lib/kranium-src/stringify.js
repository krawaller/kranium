/**
 * TiObject stringifier based heavily on code from @rem's JSConsole
 */

(function(global){
	var reTiObject = /^\[object Ti/;
	function sortci(a, b) {
	  return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
	}

	function stringify(o, simple) {
	  var json = '', i, type = ({}).toString.call(o), parts = [], names = [], ownType = o && o.toString && o.toString();
  
	  if (type == '[object String]') {
	    json = '"' + o.replace(/"/g, '\\"') + '"';
	  } else if (type == '[object Array]') {
	    json = '[';
	    for (i = 0; i < o.length; i++) {
	      parts.push(stringify(o[i], simple));
	    }
	    json += parts.join(', ') + ']';
	    json;
	  } else if (o === null) {
	    json = 'null';
	  } else if (o === undefined) {
	    json = 'undefined';
	  } else if (ownType && reTiObject.test(ownType)) {
		json += [
			'"',
			"<",
			(o._type||'unknown'),
			(o._id ? " id='"+o._id+"'" : ""),
			o.className ? " class='"+o.className+"'" : "",
			">",
			((tmp = (o.text||o.title||""))? tmp :''),
			"</" + (o._type||'unknown') + ">",
			'"'
		].join("");
	  } else if (type == '[object Object]') {
	    json = '{';
	    for (i in o) {
	      names.push(i);
	    }
	    names.sort(sortci);
	    for (i = 0; i < names.length; i++) {
	      parts.push(stringify(names[i]) + ': ' + stringify(o[names[i] ], simple));
	    }
	    json += parts.join(', ') + '}';
	  } else if (type == '[object Number]') {
	    json = o+'';
	  } else if (type == '[object Boolean]') {
	    json = o ? 'true' : 'false';
	  } else if (type == '[object Function]') {
	    json = o.toString();
	  } else if (simple == undefined) {
	    json = type + '{\n';
	    for (i in o) {
	      names.push(i);
	    }
	    names.sort(sortci);
	    for (i = 0; i < names.length; i++) {
	      parts.push(names[i] + ': ' + stringify(o[names[i]], true)); // safety from max stack
	    }
	    json += parts.join(',\n') + '\n}';
	  } else {
	    try {
	      json = o+''; // should look like an object      
	    } catch (e) {}
	  }
	  return json;
	}
	K.stringify = stringify;

})(this);