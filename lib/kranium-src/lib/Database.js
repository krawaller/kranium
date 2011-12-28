/**
 * Define db module
 */

(function(global){
	K.db = function(path, version){
		this.db = Ti.Database.install(path, '0.0.1');
		this.db.execute.call = Function.prototype.call;
		this.db.execute.apply = Function.prototype.apply;
	};
	
	/**
	 * Execute enhanced with named parameters and automatic result resolving
	 *
	 * @param {String} query 
	 * @param {Object|String|Integer} a1 Object with named parameters or a plain arg
	 * @param {String|Integer} a2
	 * @param {String|Integer} a3
	 * @returns {Array}
	 */
	K.db.prototype.execute = function(){
		var args = Array.prototype.slice.call(arguments);
		if(args.length === 2 && typeof args[1] !== 'string'){
			var query = args[0],
				params = args[1],

				prepared = [];

			query.replace(/@([A-Za-z_]+)/g, function($0, $1){
				prepared.push(typeof params[$1] !== "undefined" ? params[$1] : '');
				return '?';
			});

			args = [query].concat(prepared);
		}

		var dbres = this.db.execute.apply(this.db, args),
			res = [];

		if(dbres && dbres.isValidRow()){
			var row = dbres,
				fieldCount = dbres.fieldCount(),
				fields = [];

			for(var i = 0; i < fieldCount; i++){
				fields.push(row.fieldName(i));
			}

			do {
				var o = {};
				for(var i = 0; i < fieldCount; i++){
					o[fields[i]] = row.field(i);
				}
				res.push(o);
			} while(row.next());
		}

		return res;	
	};
})(this);