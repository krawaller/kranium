/*!
(The MIT License)

Copyright (c) 2009-2010 TJ Holowaychuk <tj@vision-media.ca>
Portions copyright (c) 2011 Jacob Waller <jacob@krawaller.se>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Kranium <3 Jade
 */

(function(){

var console = {
	log: K.log
};


// CommonJS require()

function require(p){
    var path = require.resolve(p)
      , mod = require.modules[path];
    if (!mod) throw new Error('failed to require "' + p + '"');
    if (!mod.exports) {
      mod.exports = {};
      mod.call(mod.exports, mod, mod.exports, require.relative(path));
    }
    return mod.exports;
  }

require.modules = {};

require.resolve = function (path){
    var orig = path
      , reg = path + '.js'
      , index = path + '/index.js';
    return require.modules[reg] && reg
      || require.modules[index] && index
      || orig;
  };

require.register = function (path, fn){
    require.modules[path] = fn;
  };

require.relative = function (parent) {
    return function(p){
      if ('.' != p[0]) return require(p);
      
      var path = parent.split('/')
        , segs = p.split('/');
      path.pop();
      
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if ('..' == seg) path.pop();
        else if ('.' != seg) path.push(seg);
      }

      return require(path.join('/'));
    };
  };


require.register("compiler.js", function(module, exports, require){

/*!
 * Jade - Compiler
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * Copyright(c) 2011 Jacob Waller <jacob@krawaller.se>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var nodes = require('./nodes')
  , filters = require('./filters')
  , doctypes = require('./doctypes')
  , selfClosing = require('./self-closing')
  , inlineTags = require('./inline-tags')
  , utils = require('./utils');

 
 if (!Object.keys) {
   Object.keys = function(obj){
     var arr = [];
     for (var key in obj) {
       if (obj.hasOwnProperty(key)) {
         arr.push(obj);
       }
     }
     return arr;
   } 
 }
 
 if (!String.prototype.trimLeft) {
   String.prototype.trimLeft = function(){
     return this.replace(/^\s+/, '');
   }
 }



/**
 * Initialize `Compiler` with the given `node`.
 *
 * @param {Node} node
 * @param {Object} options
 * @api public
 */

var Compiler = module.exports = function Compiler(node, options) {
  this.options = options = options || {};
  this.node = node;
  this.hasCompiledDoctype = false;
  this.hasCompiledTag = false;
  this.pp = options.pretty || false;
  this.indents = 0;
  if (options.doctype) this.setDoctype(options.doctype);
};

valueAttrByTagName = {
	label: 'text',
	textfield: 'value',
	button: 'title',
	row: 'title',
	def: 'text'
};
function getValueAttr(tagName){
	return valueAttrByTagName[tagName]||valueAttrByTagName.def;
}

/**
 * Compiler prototype.
 */

Compiler.prototype = {
  
  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */
  
  compile: function(){
    this.buf = [];
    this.visit(this.node);
    return this.buf.join('\n');
  },

  /**
   * Sets the default doctype `name`. Sets terse mode to `true` when
   * html 5 is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {string} name
   * @api public
   */
  
  setDoctype: function(name){
    var doctype = doctypes[(name || 'default').toLowerCase()];
    if (!doctype) throw new Error('unknown doctype "' + name + '"');
    this.doctype = doctype;
    this.terse = '5' == name || 'html' == name;
    this.xml = 0 == this.doctype.indexOf('<?xml');
  },
  
  /**
   * Buffer the given `str` optionally escaped.
   *
   * @param {String} str
   * @param {Boolean} esc
   * @api public
   */
  
  buffer: function(str, esc){
    //if (esc) str = utils.escape(str);
    //this.buf.push("buf.push('" + str + "');");
	this.buf.push("'" + str + "'");
  },
  
  /**
   * Buffer the given `node`'s lineno.
   *
   * @param {Node} node
   * @api public
   */
  
  line: function(node){
    if (node.instrumentLineNumber === false) return;
    //this.buf.push('(__.lineno = ' + node.line + ');');
  },
  
  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */
  
  visit: function(node, obj){
    this.line(node);
    return this.visitNode(node, obj);
  },
  
  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */
  
  visitNode: function(node, obj){
	
    var name = node.constructor.name
      || node.constructor.toString().match(/function ([^(\s]+)()/)[1];
//console.log('visiting: ' + name, obj)
    return this['visit' + name](node, obj);
  },
  
  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */

  visitBlock: function(block, obj){
	//console.log('visitblock', obj)
    var len = len = block.nodes.length;
    for (var i = 0; i < len; ++i) {
      this.visit(block.nodes[i], obj);
    }
  },
  
  /**
   * Visit `doctype`. Sets terse mode to `true` when html 5
   * is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {Doctype} doctype
   * @api public
   */
  
  visitDoctype: function(doctype){
    if (doctype && (doctype.val || !this.doctype)) {
      this.setDoctype(doctype.val || 'default');
    }

    if (this.doctype) this.buffer(this.doctype);
    this.hasCompiledDoctype = true;
  },

  /**
   * Visit `mixin`, generating a function that
   * may be called within the template.
   *
   * @param {Mixin} mixin
   * @api public
   */

  visitMixin: function(mixin){
    var name = mixin.name.replace(/-/g, '_') + '_mixin'
      , args = mixin.args || '';

    if (mixin.block) {
      this.buf.push('var ' + name + ' = function(' + args + '){');
      this.visit(mixin.block);
      this.buf.push('}');
    } else {
      this.buf.push(name + '(' + args + ');');
    }
  },

  /**
   * Visit `tag` buffering tag markup, generating
   * attributes, visiting the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @api public
   */
  
  visitTag: function(tag, parent){

    this.indents++;
    var name = tag.name;

	//console.log(name);
	
	var obj = {};
	obj.type = name;
	
	this.buf.push('__els.push({\t\ntype: "'+name+'"');
	
	if (tag.attrs.length) this.visitAttributes(tag.attrs);

	if (tag.code) this.visitCode(tag.code, obj, name);
    if (tag.text) this.buf.push(', ' + getValueAttr(name) + ': "' + (utils.text(tag.text.nodes[0].trimLeft())) + '"' );

	var hasChildren = tag.block && tag.block.nodes && tag.block.nodes.length;
	if(hasChildren){
		this.buf.push(', ' + (name == 'tableview' ? 'data' : 'children')  + ': (function(){ var __els = []; ');
	}

    this.visit(tag.block, tag);

	if(hasChildren){
		this.buf.push(' return __els; })() ');
	}

	this.buf.push(' });');
    this.indents--;

  },
  
  /**
   * Visit `filter`, throwing when the filter does not exist.
   *
   * @param {Filter} filter
   * @api public
   */
  
  visitFilter: function(filter){
    var fn = filters[filter.name];

    // unknown filter
    if (!fn) {
      if (filter.isASTFilter) {
        throw new Error('unknown ast filter "' + filter.name + ':"');
      } else {
        throw new Error('unknown filter ":' + filter.name + '"');
      }
    }
    if (filter.isASTFilter) {
      this.buf.push(fn(filter.block, this, filter.attrs));
    } else {
      var text = filter.block.nodes.join('');
      this.buffer(utils.text(fn(text, filter.attrs)));
    }
  },
  
  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */
  
  visitText: function(text){
    text = utils.text(text.nodes.join(''));
    //if (this.escape) text = escape(text);
    this.buffer(text);
    this.buffer('\\n');
  },
  
  /**
   * Visit a `comment`, only buffering when the buffer flag is set.
   *
   * @param {Comment} comment
   * @api public
   */
  
  visitComment: function(comment){
    if (!comment.buffer) return;
    if (this.pp) this.buffer('\\n' + Array(this.indents + 1).join('  '));
    this.buffer('<!--' + utils.escape(comment.val) + '-->');
  },
  
  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */
  
  visitBlockComment: function(comment){
    if (!comment.buffer) return;
    if (0 == comment.val.indexOf('if')) {
      this.buffer('<!--[' + comment.val + ']>');
      this.visit(comment.block);
      this.buffer('<![endif]-->');
    } else {
      this.buffer('<!--' + comment.val);
      this.visit(comment.block);
      this.buffer('-->');
    }
  },
  
  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */
  
  visitCode: function(code, obj, tagName){
    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control

    // Buffer code
    /*if (code.buffer) {
      var val = code.val.trimLeft();
      this.buf.push('var __val__ = ' + val);
      val = 'null == __val__ ? "" : __val__';
      if (code.escape) val = 'escape(' + val + ')';
      this.buf.push("buf.push(" + val + ");");
    } else {*/
	//console.log('codely: ' + tagName, code);
	
	if(tagName){
		this.buf.push(", " + getValueAttr(tagName) + ": (" + code.val.trim() + ")");
	} else {
		this.buf.push(code.val);
	}
    
    //}

    // Block support
    if (code.block) {
      if (!code.buffer) this.buf.push('{');
      this.visit(code.block, obj);
      if (!code.buffer) this.buf.push('}');
    }
  },
  
  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */
  
  visitEach: function(each, obj){
	//console.log('iterate: ', each.obj, obj, each);
	
	/*each = function(obj, iterator){
		var ret = [];
		if(Array.isArray(obj)){
			for(var i = 0, len = obj.length; i < len; i++){
				iterator(obj[i]);
			}
		} else if(Object.prototype.toString.call(obj) === "[object Object]"){
			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					iterator(obj[key], key);
				}
			}
		} else {
			iterator(obj);
		}
	}*/
	
	this.buf.push('each('+each.obj+', function('+each.val+', '+each.key+'){ ');
	this.visit(each.block, true);
	this.buf.push(' });');
	
  },
  
  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */
  
  visitAttributes: function(attrs, obj){
    var classes = [],
		buf = [];

    //if (this.terse) buf.push('terse: true');

    attrs.forEach(function(attr){
      if (attr.name == 'class') {
        classes.push(attr.val);
      } else {
		buf.push(attr.name + ": " + attr.val);
      }
    });

    if (classes.length) {
      classes = classes.join(" + ' ' + ");
	  buf.push("className: " + classes);
    }

    this.buf.push(", " + buf.join(", "));
  }
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

function escape(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
}); // module: compiler.js

require.register("doctypes.js", function(module, exports, require){

}); // module: doctypes.js

require.register("filters.js", function(module, exports, require){

}); // module: filters.js

require.register("inline-tags.js", function(module, exports, require){

}); // module: inline-tags.js

require.register("jade.js", function(module, exports, require){

/*!
 * Jade
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Parser = require('./parser')
  , Compiler = require('./compiler')

/**
 * Library version.
 */

exports.version = '0.13.0';

/**
 * Intermediate JavaScript cache.
 */

var cache = exports.cache = {};

/**
 * Text filters.
 */

exports.filters = require('./filters');

/**
 * Utilities.
 */

exports.utils = require('./utils');

/**
 * Expose `Compiler`.
 */

exports.Compiler = Compiler;

/**
 * Expose `Parser`.
 */

exports.Parser = Parser;

/**
 * Iterate object or array with keys and values
 *
 * @param {Object|Array} obj
 * @param {Function} iterator
 * @api private
 */

function each(obj, iterator){
	var ret = [];
	if(Array.isArray(obj)){
		for(var i = 0, len = obj.length; i < len; i++){
			iterator(obj[i]);
		}
	} else if(Object.prototype.toString.call(obj) === "[object Object]"){
		for(var key in obj){
			if(obj.hasOwnProperty(key)){
				iterator(obj[key], key);
			}
		}
	} else {
		iterator(obj);
	}
}


/**
 * Re-throw the given `err` in context to the
 * `str` of jade, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno){
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context); 

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno 
    + '\n' + context + '\n\n' + err.message;
  throw err;
}

/**
 * Parse the given `str` of jade and return a function body.
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api private
 */

function parse(str, options){
  var filename = options.filename;
  try {
    // Parse
    var parser = new Parser(str, filename);
    if (options.debug) parser.debug();

    // Compile
    var compiler = new (options.compiler || Compiler)(parser.parse(), options)
      , js = compiler.compile();

    // Debug compiler
    if (options.debug) {
      console.log('\n\x1b[1mCompiled Function\x1b[0m:\n\n%s', js.replace(/^/gm, '  '));
    }

    try {
      return ''
        //+ attrs.toString() + '\n\n'
        //+ escape.toString()  + '\n\n'
		+ each.toString()  + '\n\n'
        + 'var __els = [];\n'
        + (options.self
          ? 'var self = locals || {}, __ = __ || locals.__;\n' + js
          : 'with (locals || {}) {' + js + '}')
        + 'return __els;';
    } catch (err) {
      process.compile(js, filename || 'Jade');
      return;
    }
  } catch (err) {
    rethrow(err, str, filename, parser.lexer.lineno);
  }
}

/**
 * Compile a `Function` representation of the given jade `str`.
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */

exports.compile = function(str, options){
  var options = options || {}
    , input = JSON.stringify(str)
    , filename = options.filename
      ? JSON.stringify(options.filename)
      : 'undefined';

  // Reduce closure madness by injecting some locals
  var fn = [
      'var __ = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };'
    , rethrow.toString()
    , 'try {'
    , parse(String(str), options || {})
    , '} catch (err) {'
    , '  rethrow(err, __.input, __.filename, __.lineno);'
    , '}'
  ].join('\n');

  return new Function('locals', fn);
};


}); // module: jade.js

require.register("lexer.js", function(module, exports, require){

/*!
 * Jade - Lexer
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Initialize `Lexer` with the given `str`.
 *
 * @param {String} str
 * @api private
 */

var Lexer = module.exports = function Lexer(str) {
  this.input = str.replace(/\r\n|\r/g, '\n');
  this.deferredTokens = [];
  this.lastIndents = 0;
  this.lineno = 1;
  this.stash = [];
  this.indentStack = [];
  this.indentRe = null;
  this.pipeless = false;
};

/**
 * Lexer prototype.
 */

Lexer.prototype = {
  
  /**
   * Construct a token with the given `type` and `val`.
   *
   * @param {String} type
   * @param {String} val
   * @return {Object}
   * @api private
   */
  
  tok: function(type, val){
    return {
        type: type
      , line: this.lineno
      , val: val
    }
  },
  
  /**
   * Consume the given `len` of input.
   *
   * @param {Number} len
   * @api private
   */
  
  consume: function(len){
    this.input = this.input.substr(len);
  },
  
  /**
   * Scan for `type` with the given `regexp`.
   *
   * @param {String} type
   * @param {RegExp} regexp
   * @return {Object}
   * @api private
   */
  
  scan: function(regexp, type){
    var captures;
    if (captures = regexp.exec(this.input)) {
      this.consume(captures[0].length);
      return this.tok(type, captures[1]);
    }
  },
  
  /**
   * Defer the given `tok`.
   *
   * @param {Object} tok
   * @api private
   */
  
  defer: function(tok){
    this.deferredTokens.push(tok);
  },
  
  /**
   * Lookahead `n` tokens.
   *
   * @param {Number} n
   * @return {Object}
   * @api private
   */
  
  lookahead: function(n){
    var fetch = n - this.stash.length;
    while (fetch-- > 0) this.stash.push(this.next());
    return this.stash[--n];
  },
  
  /**
   * Return the indexOf `start` / `end` delimiters.
   *
   * @param {String} start
   * @param {String} end
   * @return {Number}
   * @api private
   */
  
  indexOfDelimiters: function(start, end){
    var str = this.input
      , nstart = 0
      , nend = 0
      , pos = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
      if (start == str[i]) {
        ++nstart;
      } else if (end == str[i]) {
        if (++nend == nstart) {
          pos = i;
          break;
        }
      }
    }
    return pos;
  },
  
  /**
   * Stashed token.
   */
  
  stashed: function() {
    return this.stash.length
      && this.stash.shift();
  },
  
  /**
   * Deferred token.
   */
  
  deferred: function() {
    return this.deferredTokens.length 
      && this.deferredTokens.shift();
  },
  
  /**
   * end-of-source.
   */
  
  eos: function() {
    if (this.input.length) return;
    if (this.indentStack.length) {
      this.indentStack.shift();
      return this.tok('outdent');
    } else {
      return this.tok('eos');
    }
  },

  /**
   * Comment.
   */
  
  comment: function() {
    var captures;
    if (captures = /^ *\/\/(-)?([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('comment', captures[2]);
      tok.buffer = '-' != captures[1];
      return tok;
    }
  },
  
  /**
   * Tag.
   */
  
  tag: function() {
    var captures;
    if (captures = /^(\w[-:\w]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok, name = captures[1];
      if (':' == name[name.length - 1]) {
        name = name.slice(0, -1);
        tok = this.tok('tag', name);
        this.deferredTokens.push(this.tok(':'));
        while (' ' == this.input[0]) this.input = this.input.substr(1);
      } else {
        tok = this.tok('tag', name);
      }
      return tok;
    }
  },
  
  /**
   * Filter.
   */
  
  filter: function() {
    return this.scan(/^:(\w+)/, 'filter');
  },
  
  /**
   * Doctype.
   */
  
  doctype: function() {
    return this.scan(/^(?:!!!|doctype) *(\w+)?/, 'doctype');
  },

  /**
   * Id.
   */
  
  id: function() {
    return this.scan(/^#([\w-]+)/, 'id');
  },
  
  /**
   * Class.
   */
  
  className: function() {
    return this.scan(/^\.([\w-]+)/, 'class');
  },
  
  /**
   * Text.
   */
  
  text: function() {
    return this.scan(/^(?:\| ?)?([^\n]+)/, 'text');
  },

  /**
   * Include.
   */
  
  include: function() {
    return this.scan(/^include +([^\n]+)/, 'include');
  },

  /**
   * Mixin.
   */

  mixin: function(){
    var captures;
    if (captures = /^mixin +([-\w]+)(?:\(([^\)]+)\))?/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('mixin', captures[1]);
      tok.args = captures[2];
      return tok;
    }
  },

  /**
   * Each.
   */
  
  each: function() {
    var captures;
    if (captures = /^- *each *(\w+)(?: *, *(\w+))? * in *([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('each', captures[1]);
      tok.key = captures[2] || 'index';
      tok.code = captures[3];
      return tok;
    }
  },
  
  /**
   * Code.
   */
  
  code: function() {
    var captures;
    if (captures = /^(!?=|-)([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var flags = captures[1];
      captures[1] = captures[2];
      var tok = this.tok('code', captures[1]);
      tok.escape = flags[0] === '=';
      tok.buffer = flags[0] === '=' || flags[1] === '=';
      return tok;
    }
  },
  
  /**
   * Attributes.
   */
  
  attrs: function() {
    if ('(' == this.input[0]) {
      var index = this.indexOfDelimiters('(', ')')
        , str = this.input.substr(1, index-1)
        , tok = this.tok('attrs')
        , len = str.length
        , states = ['key']
        , key = ''
        , val = ''
        , quote
        , c;

      function state(){
        return states[states.length - 1];
      }

      function interpolate(attr) {
        return attr.replace(/#\{([^}]+)\}/g, function(_, expr){
          return quote + " + (" + expr + ") + " + quote;
        });
      }

      this.consume(index + 1);
      tok.attrs = {};

      function parse(c) {
        switch (c) {
          case ',':
          case '\n':
            switch (state()) {
              case 'expr':
              case 'array':
              case 'string':
              case 'object':
                val += c;
                break;
              default:
                states.push('key');
                val = val.trim();
                key = key.trim();
                if ('' == key) return;
                tok.attrs[key.replace(/^['"]|['"]$/g, '')] = '' == val
                  ? true
                  : interpolate(val);
                key = val = '';
            }
            break;
          case '=':
            switch (state()) {
              case 'key char':
                key += c;
                break;
              case 'val':
              case 'expr':
              case 'array':
              case 'string':
              case 'object':
                val += c;
                break;
              default:
                states.push('val');
            }
            break;
          case '(':
            if ('val' == state()) states.push('expr');
            val += c;
            break;
          case ')':
            if ('expr' == state()) states.pop();
            val += c;
            break;
          case '{':
            if ('val' == state()) states.push('object');
            val += c;
            break;
          case '}':
            if ('object' == state()) states.pop();
            val += c;
            break;
          case '[':
            if ('val' == state()) states.push('array');
            val += c;
            break;
          case ']':
            if ('array' == state()) states.pop();
            val += c;
            break;
          case '"':
          case "'":
            switch (state()) {
              case 'key':
                states.push('key char');
                break;
              case 'key char':
                states.pop();
                break;
              case 'string':
                if (c == quote) states.pop();
                val += c;
                break;
              default:
                states.push('string');
                val += c;
                quote = c;
            }
            break;
          case '':
            break;
          default:
            switch (state()) {
              case 'key':
              case 'key char':
                key += c;
                break;
              default:
                val += c;
            }
        }
      }

      for (var i = 0; i < len; ++i) {
        parse(str[i]);
      }

      parse(',');

      return tok;
    }
  },
  
  /**
   * Indent | Outdent | Newline.
   */
  
  indent: function() {
    var captures, re;

    // established regexp
    if (this.indentRe) {
      captures = this.indentRe.exec(this.input);
    // determine regexp
    } else {
      // tabs
      re = /^\n(\t*) */;
      captures = re.exec(this.input);

      // spaces
      if (captures && !captures[1].length) {
        re = /^\n( *)/;
        captures = re.exec(this.input);
      }

      // established
      if (captures && captures[1].length) this.indentRe = re;
    }

    if (captures) {
      var tok
        , indents = captures[1].length;

      ++this.lineno;
      this.consume(indents + 1);

      if (' ' == this.input[0] || '\t' == this.input[0]) {
        throw new Error('Invalid indentation, you can use tabs or spaces but not both');
      }

      // blank line
      if ('\n' == this.input[0]) return this.tok('newline');

      // outdent
      if (this.indentStack.length && indents < this.indentStack[0]) {
        while (this.indentStack.length && this.indentStack[0] > indents) {
          this.stash.push(this.tok('outdent'));
          this.indentStack.shift();
        }
        tok = this.stash.pop();
      // indent
      } else if (indents && indents != this.indentStack[0]) {
        this.indentStack.unshift(indents);
        tok = this.tok('indent', indents);
      // newline
      } else {
        tok = this.tok('newline');
      }

      return tok;
    }
  },

  /**
   * Pipe-less text consumed only when 
   * pipeless is true;
   */

  pipelessText: function() {
    if (this.pipeless) {
      if ('\n' == this.input[0]) return;
      var i = this.input.indexOf('\n');
      if (-1 == i) i = this.input.length;
      var str = this.input.substr(0, i);
      this.consume(str.length);
      return this.tok('text', str);
    }
  },

  /**
   * ':'
   */

  colon: function() {
    return this.scan(/^: */, ':');
  },

  /**
   * Return the next token object, or those
   * previously stashed by lookahead.
   *
   * @return {Object}
   * @api private
   */
  
  advance: function(){
    return this.stashed()
      || this.next();
  },
  
  /**
   * Return the next token object.
   *
   * @return {Object}
   * @api private
   */
  
  next: function() {
    return this.deferred()
      || this.eos()
      || this.pipelessText()
      || this.doctype()
      || this.include()
      || this.mixin()
      || this.tag()
      || this.filter()
      || this.each()
      || this.code()
      || this.id()
      || this.className()
      || this.attrs()
      || this.indent()
      || this.comment()
      || this.colon()
      || this.text();
  }
};

}); // module: lexer.js

require.register("nodes/block-comment.js", function(module, exports, require){

}); // module: nodes/block-comment.js

require.register("nodes/block.js", function(module, exports, require){

/*!
 * Jade - nodes - Block
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node');

/**
 * Initialize a new `Block` with an optional `node`.
 *
 * @param {Node} node
 * @api public
 */

var Block = module.exports = function Block(node){
  this.nodes = [];
  if (node) this.push(node);
};

/**
 * Inherit from `Node`.
 */

Block.prototype = new Node;
Block.prototype.constructor = Block;


/**
 * Pust the given `node`.
 *
 * @param {Node} node
 * @return {Number}
 * @api public
 */

Block.prototype.push = function(node){
  return this.nodes.push(node);
};

/**
 * Unshift the given `node`.
 *
 * @param {Node} node
 * @return {Number}
 * @api public
 */

Block.prototype.unshift = function(node){
  return this.nodes.unshift(node);
};

}); // module: nodes/block.js

require.register("nodes/code.js", function(module, exports, require){

/*!
 * Jade - nodes - Code
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node');

/**
 * Initialize a `Code` node with the given code `val`.
 * Code may also be optionally buffered and escaped.
 *
 * @param {String} val
 * @param {Boolean} buffer
 * @param {Boolean} escape
 * @api public
 */

var Code = module.exports = function Code(val, buffer, escape) {
  this.val = val;
  this.buffer = buffer;
  this.escape = escape;
  if (/^ *else/.test(val)) this.instrumentLineNumber = false;
};

/**
 * Inherit from `Node`.
 */

Code.prototype = new Node;
Code.prototype.constructor = Code;

}); // module: nodes/code.js

require.register("nodes/comment.js", function(module, exports, require){

/*!
 * Jade - nodes - Comment
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node');

/**
 * Initialize a `Comment` with the given `val`, optionally `buffer`,
 * otherwise the comment may render in the output.
 *
 * @param {String} val
 * @param {Boolean} buffer
 * @api public
 */

var Comment = module.exports = function Comment(val, buffer) {
  this.val = val;
  this.buffer = buffer;
};

/**
 * Inherit from `Node`.
 */

Comment.prototype = new Node;
Comment.prototype.constructor = Comment;

}); // module: nodes/comment.js

require.register("nodes/doctype.js", function(module, exports, require){

}); // module: nodes/doctype.js

require.register("nodes/each.js", function(module, exports, require){

/*!
 * Jade - nodes - Each
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node');

/**
 * Initialize an `Each` node, representing iteration
 *
 * @param {String} obj
 * @param {String} val
 * @param {String} key
 * @param {Block} block
 * @api public
 */

var Each = module.exports = function Each(obj, val, key, block) {
  this.obj = obj;
  this.val = val;
  this.key = key;
  this.block = block;
};

/**
 * Inherit from `Node`.
 */

Each.prototype = new Node;
Each.prototype.constructor = Each;

}); // module: nodes/each.js

require.register("nodes/filter.js", function(module, exports, require){

/*!
 * Jade - nodes - Filter
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node')
  , Block = require('./block');

/**
 * Initialize a `Filter` node with the given 
 * filter `name` and `block`.
 *
 * @param {String} name
 * @param {Block|Node} block
 * @api public
 */

var Filter = module.exports = function Filter(name, block, attrs) {
  this.name = name;
  this.block = block;
  this.attrs = attrs;
  this.isASTFilter = block instanceof Block;
};

/**
 * Inherit from `Node`.
 */

Filter.prototype = new Node;
Filter.prototype.constructor = Filter;

}); // module: nodes/filter.js

require.register("nodes/index.js", function(module, exports, require){

/*!
 * Jade - nodes
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

exports.Node = require('./node');
exports.Tag = require('./tag');
exports.Code = require('./code');
exports.Each = require('./each');
exports.Text = require('./text');
exports.Block = require('./block');
exports.Mixin = require('./mixin');
exports.Filter = require('./filter');
exports.Comment = require('./comment');
exports.BlockComment = require('./block-comment');
exports.Doctype = require('./doctype');

}); // module: nodes/index.js

require.register("nodes/mixin.js", function(module, exports, require){

}); // module: nodes/mixin.js

require.register("nodes/node.js", function(module, exports, require){

/*!
 * Jade - nodes - Node
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Initialize a `Node`.
 *
 * @api public
 */

var Node = module.exports = function Node(){};
}); // module: nodes/node.js

require.register("nodes/tag.js", function(module, exports, require){

/*!
 * Jade - nodes - Tag
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node'),
    Block = require('./block');

/**
 * Initialize a `Tag` node with the given tag `name` and optional `block`.
 *
 * @param {String} name
 * @param {Block} block
 * @api public
 */

var Tag = module.exports = function Tag(name, block) {
  this.name = name;
  this.attrs = [];
  this.block = block || new Block;
};

/**
 * Inherit from `Node`.
 */

Tag.prototype = new Node;
Tag.prototype.constructor = Tag;


/**
 * Set attribute `name` to `val`, keep in mind these become
 * part of a raw js object literal, so to quote a value you must
 * '"quote me"', otherwise or example 'user.name' is literal JavaScript.
 *
 * @param {String} name
 * @param {String} val
 * @return {Tag} for chaining
 * @api public
 */

Tag.prototype.setAttribute = function(name, val){
  this.attrs.push({ name: name, val: val });
  return this;
};

/**
 * Remove attribute `name` when present.
 *
 * @param {String} name
 * @api public
 */

Tag.prototype.removeAttribute = function(name){
  for (var i = 0, len = this.attrs.length; i < len; ++i) {
    if (this.attrs[i] && this.attrs[i].name == name) {
      delete this.attrs[i];
    }
  }
};

/**
 * Get attribute value by `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Tag.prototype.getAttribute = function(name){
  for (var i = 0, len = this.attrs.length; i < len; ++i) {
    if (this.attrs[i] && this.attrs[i].name == name) {
      return this.attrs[i].val;
    }
  }
};

}); // module: nodes/tag.js

require.register("nodes/text.js", function(module, exports, require){

/*!
 * Jade - nodes - Text
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('./node');

/**
 * Initialize a `Text` node with optional `line`.
 *
 * @param {String} line
 * @api public
 */

var Text = module.exports = function Text(line) {
  this.nodes = [];
  if ('string' == typeof line) this.push(line);
};

/**
 * Inherit from `Node`.
 */

Text.prototype = new Node;
Text.prototype.constructor = Text;


/**
 * Push the given `node.`
 *
 * @param {Node} node
 * @return {Number}
 * @api public
 */

Text.prototype.push = function(node){
  return this.nodes.push(node);
};

}); // module: nodes/text.js

require.register("parser.js", function(module, exports, require){

/*!
 * Jade - Parser
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Lexer = require('./lexer')
  , nodes = require('./nodes');

/**
 * Initialize `Parser` with the given input `str` and `filename`.
 *
 * @param {String} str
 * @param {String} filename
 * @api public
 */

var Parser = exports = module.exports = function Parser(str, filename){
  this.input = str;
  this.lexer = new Lexer(str);
  this.filename = filename;
};

/**
 * Tags that may not contain tags.
 */

var textOnly = exports.textOnly = ['code', 'script', 'textarea', 'style', 'title'];

/**
 * Parser prototype.
 */

Parser.prototype = {
  
  /**
   * Output parse tree to stdout. 
   *
   * @api public
   */
  
  debug: function(){
    var lexer = new Lexer(this.input)
      , tree = require('sys').inspect(this.parse(), false, 12, true);
    console.log('\n\x1b[1mParse Tree\x1b[0m:\n');
    console.log(tree);
    this.lexer = lexer;
  },
  
  /**
   * Return the next token object.
   *
   * @return {Object}
   * @api private
   */

  advance: function(){
    return this.lexer.advance();
  },
  
  /**
   * Single token lookahead.
   *
   * @return {Object}
   * @api private
   */
  
  peek: function() {
    return this.lookahead(1);
  },
  
  /**
   * Return lexer lineno.
   *
   * @return {Number}
   * @api private
   */
  
  line: function() {
    return this.lexer.lineno;
  },
  
  /**
   * `n` token lookahead.
   *
   * @param {Number} n
   * @return {Object}
   * @api private
   */
  
  lookahead: function(n){
    return this.lexer.lookahead(n);
  },
  
  /**
   * Parse input returning a string of js for evaluation.
   *
   * @return {String}
   * @api public
   */
  
  parse: function(){
    var block = new nodes.Block;
    block.line = this.line();
    while ('eos' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else {
        block.push(this.parseExpr());
      }
    }
    return block;
  },
  
  /**
   * Expect the given type, or throw an exception.
   *
   * @param {String} type
   * @api private
   */
  
  expect: function(type){
    if (this.peek().type === type) {
      return this.advance();
    } else {
      throw new Error('expected "' + type + '", but got "' + this.peek().type + '"');
    }
  },
  
  /**
   * Accept the given `type`.
   *
   * @param {String} type
   * @api private
   */
  
  accept: function(type){
    if (this.peek().type === type) {
      return this.advance();
    }
  },
  
  /**
   *   tag
   * | doctype
   * | mixin
   * | include
   * | filter
   * | comment
   * | text
   * | each
   * | code
   * | id
   * | class
   */
  
  parseExpr: function(){
    switch (this.peek().type) {
      case 'tag':
        return this.parseTag();
      case 'mixin':
        return this.parseMixin();
      case 'include':
        return this.parseInclude();
      case 'doctype':
        return this.parseDoctype();
      case 'filter':
        return this.parseFilter();
      case 'comment':
        return this.parseComment();
      case 'text':
        return this.parseText();
      case 'each':
        return this.parseEach();
      case 'code':
        return this.parseCode();
      case 'id':
      case 'class':
        var tok = this.advance();
        this.lexer.defer(this.lexer.tok('tag', 'div'));
        this.lexer.defer(tok);
        return this.parseExpr();
      default:
        throw new Error('unexpected token "' + this.peek().type + '"');
    }
  },
  
  /**
   * Text
   */
  
  parseText: function(){
    var tok = this.expect('text')
      , node = new nodes.Text(tok.val);
    node.line = this.line();
    return node;
  },
  
  /**
   * code
   */
  
  parseCode: function(){
    var tok = this.expect('code')
      , node = new nodes.Code(tok.val, tok.buffer, tok.escape);
    node.line = this.line();
    if ('indent' == this.peek().type) {
      node.block = this.parseBlock();
    }
    return node;
  },
  
  /**
   * comment
   */
  
  parseComment: function(){
    var tok = this.expect('comment')
      , node;

    if ('indent' == this.peek().type) {
      node = new nodes.BlockComment(tok.val, this.parseBlock(), tok.buffer);
    } else {
      node = new nodes.Comment(tok.val, tok.buffer);
    }

    node.line = this.line();
    return node;
  },
  
  /**
   * doctype
   */
  
  parseDoctype: function(){
    var tok = this.expect('doctype')
      , node = new nodes.Doctype(tok.val);
    node.line = this.line();
    return node;
  },
  
  /**
   * filter attrs? text-block
   */
  
  parseFilter: function(){
    var block
      , tok = this.expect('filter')
      , attrs = this.accept('attrs');

    this.lexer.pipeless = true;
    block = this.parseTextBlock();
    this.lexer.pipeless = false;

    var node = new nodes.Filter(tok.val, block, attrs && attrs.attrs);
    node.line = this.line();
    return node;
  },
  
  /**
   * tag ':' attrs? block
   */
  
  parseASTFilter: function(){
    var block
      , tok = this.expect('tag')
      , attrs = this.accept('attrs');

    this.expect(':');
    block = this.parseBlock();

    var node = new nodes.Filter(tok.val, block, attrs && attrs.attrs);
    node.line = this.line();
    return node;
  },
  
  /**
   * each block
   */
  
  parseEach: function(){
    var tok = this.expect('each')
      , node = new nodes.Each(tok.code, tok.val, tok.key, this.parseBlock());
    node.line = this.line();
    return node;
  },

  /**
   * include
   */

  parseInclude: function(){
    var path = require('path')
      , fs = require('fs')
      , dirname = path.dirname
      , join = path.join;

    if (!this.filename)
      throw new Error('the "filename" option is required to use includes');

    var path = name = this.expect('include').val.trim()
      , dir = dirname(this.filename)
      , path = join(dir, path + '.jade');

    var str = fs.readFileSync(path, 'utf8')
      , parser = new Parser(str, path)
      , ast = parser.parse();

    return ast;
  },

  /**
   * mixin block
   */

  parseMixin: function(){
    var tok = this.expect('mixin')
      , name = tok.val
      , args = tok.args;
    var block = 'indent' == this.peek().type
      ? this.parseBlock()
      : null;
    return new nodes.Mixin(name, args, block);
  },

  /**
   * indent (text | newline)* outdent
   */

  parseTextBlock: function(){
    var text = new nodes.Text;
    text.line = this.line();
    var spaces = this.expect('indent').val;
    if (null == this._spaces) this._spaces = spaces;
    var indent = Array(spaces - this._spaces + 1).join(' ');
    while ('outdent' != this.peek().type) {
      switch (this.peek().type) {
        case 'newline':
          text.push('\\n');
          this.advance();
          break;
        case 'indent':
          text.push('\\n');
          this.parseTextBlock().nodes.forEach(function(node){
            text.push(node);
          });
          text.push('\\n');
          break;
        default:
          text.push(indent + this.advance().val);
      }
    }

    if (spaces == this._spaces) this._spaces = null;
    this.expect('outdent');
    return text;
  },

  /**
   * indent expr* outdent
   */
  
  parseBlock: function(){
    var block = new nodes.Block;
    block.line = this.line();
    this.expect('indent');
    while ('outdent' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else {
        block.push(this.parseExpr());
      }
    }
    this.expect('outdent');
    return block;
  },

  /**
   * tag (attrs | class | id)* (text | code | ':')? newline* block?
   */
  
  parseTag: function(){
    // ast-filter look-ahead
    var i = 2;
    if ('attrs' == this.lookahead(i).type) ++i;
    if (':' == this.lookahead(i).type) {
      if ('indent' == this.lookahead(++i).type) {
        return this.parseASTFilter();
      }
    }

    var name = this.advance().val
      , tag = new nodes.Tag(name);

    tag.line = this.line();

    // (attrs | class | id)*
    out:
      while (true) {
        switch (this.peek().type) {
          case 'id':
          case 'class':
            var tok = this.advance();
            tag.setAttribute(tok.type, "'" + tok.val + "'");
            continue;
          case 'attrs':
            var obj = this.advance().attrs
              , names = Object.keys(obj);
            for (var i = 0, len = names.length; i < len; ++i) {
              var name = names[i]
                , val = obj[name];
              tag.setAttribute(name, val);
            }
            continue;
          default:
            break out;
        }
      }

    // check immediate '.'
    if ('.' == this.peek().val) {
      tag.textOnly = true;
      this.advance();
    }

    // (text | code | ':')?
    switch (this.peek().type) {
      case 'text':
        tag.text = this.parseText();
        break;
      case 'code':
        tag.code = this.parseCode();
        break;
      case ':':
        this.advance();
        tag.block = new nodes.Block;
        tag.block.push(this.parseTag());
        break;
    }

    // newline*
    while ('newline' == this.peek().type) this.advance();

    tag.textOnly = tag.textOnly || ~textOnly.indexOf(tag.name);

    // script special-case
    if ('script' == tag.name) {
      var type = tag.getAttribute('type');
      if (type && 'text/javascript' != type.replace(/^['"]|['"]$/g, '')) {
        tag.textOnly = false;
      }
    }

    // block?
    if ('indent' == this.peek().type) {
      if (tag.textOnly) {
        this.lexer.pipeless = true;
        tag.block = this.parseTextBlock();
        this.lexer.pipeless = false;
      } else {
        var block = this.parseBlock();
        if (tag.block) {
          for (var i = 0, len = block.nodes.length; i < len; ++i) {
            tag.block.push(block.nodes[i]);
          }
        } else {
          tag.block = block;
        }
      }
    }
    
    return tag;
  }
};

}); // module: parser.js

require.register("runtime.js", function(module, exports, require){

}); // module: runtime.js

require.register("self-closing.js", function(module, exports, require){

}); // module: self-closing.js

require.register("utils.js", function(module, exports, require){

/*!
 * Jade - utils
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Convert interpolation in the given string to JavaScript.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

var interpolate = exports.interpolate = function(str){
  return str.replace(/(\\)?([#!])\{(.*?)\}/g, function(str, escape, flag, code){
    return escape
      ? str
      : "' + "
        + ('!' == flag ? '' : 'escape')
        + "((interp = " + code.replace(/\\'/g, "'")
        + ") == null ? '' : interp) + '";
  });
};

/**
 * Escape single quotes in `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

var escape = exports.escape = function(str) {
  return str.replace(/'/g, "\\'");
};

/**
 * Interpolate, and escape the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.text = function(str){
  return interpolate(escape(str));
};
}); // module: utils.js







var jade = require('jade');

var jadeFile = /\.jade$/,
	jadeCache = {};
	
K.jade = function(jadeStr, o){
	var fn, cacheName, arr;

	if(!o && jadeStr._jadeInput){
		o = jadeStr._jadeInput;
	}

	if(!(fn = jadeCache[jadeStr])){
		if(jadeFile.test(jadeStr)){
			cacheName = jadeStr; 
			jadeStr = K.file('jade/' + jadeStr);
		} else {
			cacheName = jadeStr;
		}
		jadeCache[cacheName] = (fn = jade.compile(jadeStr));
	}

	return K.create((arr = fn(o)).length === 1 ? arr[0] : arr);
};

})();