/**
 * Define stringify module
 */

/*!
TiObject stringifier is based heavily on code from @rem's JSConsole, which has the following license

Copyright (c) 2010 Remy Sharp, http://jsconsole.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/

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