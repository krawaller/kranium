exports.Class = TableView.extend({	
	init: function(o){
		var me = this, 
			tableview;
	
	
		var statusLabel = K.createLabel({ text: K.l('pull_down_to_refresh'), className: 'pullToRefreshStatusLabel' });
		var arrow = K.createView({ className: 'pullToRefreshArrow' });
		var lastUpdatedLabel = K.createLabel({ text: me.getTimeLabelText(), className: 'pullToRefreshLastUpdatedLabel' });
		var actInd = K.createActivityIndicator({ className: 'pullToRefreshActivityIndicator' });

		var tableHeader = K.createView({
			className: 'pullToRefreshHeader',
			children: [
				{ type: 'view', className: 'pullToRefreshBorder' }, 
				statusLabel,
				arrow,
				lastUpdatedLabel,
				actInd
			]
		});

		this.headerPullView = tableHeader;

		var pulling = false;
		var reloading = false;

		function endReloading() {
			// when you're done, just reset
			tableview.setContentInsets({top:0},{animated:true});
			reloading = false;
			lastUpdatedLabel.text = me.getTimeLabelText();
			statusLabel.text = K.l('pull_down_to_refresh');
			actInd.hide();
			arrow.show();
		}

		
		this._super.call(this, o);
		tableview = this.el;	
		
		tableview.addEventListener('scroll', function(e) {
			var offset = e.contentOffset.y;
			if (offset <= -65.0 && !pulling) {
				var t = Ti.UI.create2DMatrix();
				t = t.rotate(-180);
				pulling = true;
				arrow.animate({
					transform: t,
					duration: 180
				});
				statusLabel.text = K.l('release_to_refresh');
			} else if (pulling && offset > -65.0 && offset < 0) {
				pulling = false;
				var t = Ti.UI.create2DMatrix();
				arrow.animate({
					transform: t,
					duration: 180
				});
				statusLabel.text = K.l('pull_down_to_refresh');
			}
		});

		tableview.addEventListener('scrollEnd', function(e) {
			if (pulling && !reloading && e.contentOffset.y <= -65.0) {
				reloading = true;
				pulling = false;
				arrow.hide();
				actInd.show();
				statusLabel.text = K.l('reloading');
				tableview.setContentInsets({
					top: 60
				},
				{
					animated: true
				});
				arrow.transform = Ti.UI.create2DMatrix();
				me.refresh && me.refresh({ anyway: endReloading });
			}
		});	
	},
	
	getTimeLabelText: function(){
		return K.l('last_updated') + " " + (new Date()).format("yyyy-mm-dd HH:MM");
	}	
});

