/*!
 * "mini" Selector Engine
 * Copyright (c) 2009 James Padolsey
 * -------------------------------------------------------
 * Dual licensed under the MIT and GPL licenses.
 *    - http://www.opensource.org/licenses/mit-license.php
 *    - http://www.gnu.org/copyleft/gpl.html
 * -------------------------------------------------------
 * Version: 0.01 (BETA)
 */
var expose = {
	qsa: '__alias',
	$$: '__alias',
	getElementsByClassName: 'getElementsByClassName',
	getElementsByTagName: 'getElementsByTagName',
	getElementById: 'getElementById'
};
exports.__expose = expose;

var _global = this;

exports.SelectorEngine = function(K, global){
	var document = global,
		SelectorEngine = _find;

	[
		{ fn: "getElementsByClassName", arrName: "elsByClassName" },
		{ fn: "getElementsByTagName", arrName: "elsByName" },
		{ fn: "getElementById", arrName: "elsById" }
	].forEach(function(o){
		var name = o.fn, 
			arrName = o.arrName,
			singular = (o.fn == "getElementById"), 
			a, 
			res;

		SelectorEngine[name] = _global[name] = function(s, context){
			var arr = K[arrName],
				res = null;

			if((a = arr[s]) && (a = (Array.isArray(a) ? a : [a]))){
				if(context){
					res = a.filter(function(el){
						do {
							if(el._uuid === context._uuid){ return true; }
						} while((el = (el.getParent()) ));
						return false;
					});
				} else {
					res = a;
				}
			}

			return singular ? Array.isArray(res) && res[0] : res;
		};
	});


    var snack = /(?:[\w\-\\.#]+)+(?:\[\w+?=([\'"])?(?:\\\1|.)+?\1\])?|\*|>/ig,
        exprClassName = /^(?:[\w\-_]+)?\.([\w\-_]+)/,
        exprId = /^(?:[\w\-_]+)?#([\w\-_]+)/,
        exprNodeName = /^([\w\*\-_]+)/,
        na = [null,null];

    function _find(selector, context) {
        /**
         * This is what you call via x()
         * Starts everything off...
         */
        var simple = /^[\w\-_#]+$/.test(selector);

        if (selector.indexOf(',') > -1) {
            var split = selector.split(/,/g), ret = [], sIndex = 0, len = split.length;
            for(; sIndex < len; ++sIndex) {
                ret = ret.concat( _find(split[sIndex], context) );
            }
            return unique(ret);
        }

        var parts = selector.match(snack),
            part = parts.pop(),
            id = (part.match(exprId) || na)[1],
            className = !id && (part.match(exprClassName) || na)[1],
            nodeName = !id && (part.match(exprNodeName) || na)[1],
            collection,
			el;

        if (className && !nodeName) {
            collection = realArray(getElementsByClassName(className, context));
        } else {
            collection = !id && realArray(getElementsByTagName(nodeName||'*', context));
			if (className) {
                collection = filterByAttr(collection, 'className', RegExp('(^|\\s)' + className + '(\\s|$)'));
            }
            if (id) {
                return (el = getElementById(id, context)) ? [el] : [];
            }
        }

		var ret = parts[0] && collection[0] ? filterParents(parts, collection, false, context) : collection;
		return ret;
    }

    function realArray(c) { return Array.prototype.slice.call(c); }

    function filterParents(selectorParts, collection, direct, context) {
        /**
         * This is where the magic happens.
         * Parents are stepped through (upwards) to
         * see if they comply with the selector.
         */

        var parentSelector = selectorParts.pop()||'';
        if (parentSelector === '>') { return filterParents(selectorParts, collection, true, context); }

        var ret = [],
            r = -1,
            id = (parentSelector.match(exprId) || na)[1],
            className = !id && (parentSelector.match(exprClassName) || na)[1],
            nodeName = !id && (parentSelector.match(exprNodeName) || na)[1],
            cIndex = -1,
            node, parent,
            matches;

        while ( (node = collection[++cIndex]) ) {
            if(context){
				if(node.getParent()._uuid == context._uuid){
					ret[++r] = node;
				}
			} else {
				parent = node.getParent();
	            do {
	                matches = !nodeName || nodeName === '*' || nodeName === parent._type;
	                matches = matches && (!id || parent._id === id);
	                matches = matches && (!className || RegExp('(^|\\s)' + className + '(\\s|$)').test(parent.className));
	                if (direct || matches) { break; }
	            } while ( (parent = parent.getParent()) );
	            if (matches) { ret[++r] = node; }
			}

        }
        return selectorParts[0] && ret[0] ? filterParents(selectorParts, ret) : ret;
    }


    var unique = (function() {
		var uid = +new Date(),
			data = (function() {

			var n = 1;
			return function(elem) {
				var cacheIndex = elem[uid],
					nextCacheIndex = n++;

				if (!cacheIndex) {
					elem[uid] = nextCacheIndex;
					return true;
				}
				return false;
			};

		})();

		return function(arr) {
			/**
			 * Returns a unique array
			 */
			var length = arr.length,
				ret = [],
				r = -1,
				i = 0,
				item;

			for (; i < length; ++i) {
				item = arr[i];
				if (data(item)) { ret[++r] = item; }
			}

			uid += 1;
			return ret;
		};
	})();

    function filterByAttr(collection, attr, regex) {
        /**
         * Filters a collection by an attribute.
         */
        var i = -1, node, r = -1, ret = [];
        while ( (node = collection[++i]) ) {
            if (regex.test(node[attr])) {
                ret[++r] = node;
            }
        }
        return ret;
    }

	return SelectorEngine;
};