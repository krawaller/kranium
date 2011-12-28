exports.Class = TableView.extend({
	init: function(o){
		var index = [],
			reNumber = /^\d$/,
			last, s;

		this.data = (this.data||[]).map(function(row, i){
			s = (row.groupstr||row.title||'').substring(0, 1).toUpperCase();
			
			if(reNumber.test(s)){
				s = '#';
			}
			
			if(s && (s != last)){
				row.header = s;
				index.push({ title: s, index: i });
				last = s;
			}
			
			if(row.children){
				row.children.unshift({ type: 'label', text: row.title, className: 'rowMain' });
				delete row.title;
			}
			return row;
		});
		index.length && (this.index = index);
					
		this._super(o);
	}
});