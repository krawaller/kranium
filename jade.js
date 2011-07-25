/**
 * Module dependencies.
 */

var jade = require('ti-jade'),
	str = require('fs').readFileSync(__dirname + '/tmp.jade', 'utf8');

var fn = jade.compile(str);
//require('fs').writeFileSync('out.jade', fn.toString());
console.log(fn.toString());

setTimeout(function() {},
60 * 60 * 1000);
