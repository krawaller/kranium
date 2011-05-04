(function(global){
	K.db = function(path, version){
		this.db = Ti.Database.install('posten.sqlite', '0.0.1');
		this.db.execute.call = Function.prototype.call;
		this.db.execute.apply = Function.prototype.apply;
	};

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