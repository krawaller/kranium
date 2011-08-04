(function(){

if(K.is.android){
	
	// Shim the buttonbar and tabbedbar modules
	function createSegmentedCreator(type){
		var camelized = ({
			buttonbar: 'buttonBar',
			tabbedbar: 'tabbedBar'
		})[type];
		
		return function(opts){
			var onClicks = [];
			if(opts.click){
				onClicks.push(opts.click);
				delete opts.click;
			}

			var	labelWidth = (opts.width||320)/opts.labels.length,
				backgroundColor = opts.backgroundColor || K.getStyle(null, type).backgroundColor || '#ccc',
				selectedBackgroundColor = K.changeColor(backgroundColor, 0.2, true),
				labels = (opts.labels||[]).map(function(o, i){
					var events = {
						click: function(){
							var me = this;
							if(type === 'tabbedbar'){
								if(bar.index === i){ return; }
								labels[bar.index].backgroundColor = backgroundColor;
								labels[i].backgroundColor = selectedBackgroundColor;
								bar.index = i;
							}

							onClicks.forEach(function(callback){
								callback.call(me, {
									index: i,
									source: bar
								});
							});
						}
					};
					if(typeof o === 'string'){
						o = { 
							type: 'label', text: o, 
							backgroundColor: type === 'tabbedbar' && i === (opts.index||0) ? selectedBackgroundColor : backgroundColor
						};
						
						events.touchstart = function(){
							if(type === 'tabbedbar' && bar.index === i){ return; }
							this.backgroundColor = selectedBackgroundColor;
						};
						
						events.touchend = function(){
							if(type === 'tabbedbar' && bar.index === i){ return; }
							this.backgroundColor = backgroundColor;
						}
					}
					o.className = (o.className||'') + ' ' + camelized + 'Label';

					return K.create(K.extend({
						width: labelWidth,
						left: labelWidth*i,
						events: events
					}, o));
				});


			var separators = [];
			labels.forEach(function(label, i){
				if(i > 0){
					separators.push(K.createView({
						top: 0,
						width: 2,
						height: 44,
						left: labelWidth*i - 1,
						backgroundImage: 'images/android-navbar-separator.png'
					}));
				}
			});

			var bar = K.createView(K.extend({
				index: 0,
				height: 44,
				children: labels.concat(separators)
			}, K.getStyle(null, type), opts));
			return bar;
		};
	}
	
	K['createTabbedBar'] = K.creators['tabbedbar'] = createSegmentedCreator('tabbedbar');
	K['createButtonBar'] = K.creators['buttonbar'] = createSegmentedCreator('buttonbar');
	
	(K.settings = K.settings||{}).alwaysUseCustomAndroidNavBar = true;
	
	// Shim the window module with pretty navbars with left- and rightNavButtons.
	Window = Window.extend({
		init: function(o){
			if(!this.navBarHidden && (this.leftNavButton || this.rightNavButton || K.settings.alwaysUseCustomAndroidNavBar)){
				this.navBarHidden = true;

				var barColor = K.getStyle(null, 'window').barColor;
				this._navBar = K.create({
					type: 'view',
					className: 'navBar',
					backgroundImage: 'images/android-navbar-overlay.png',
					children: [{
						type: 'label',
						className: 'navBarLabel',
						text: this.title || ''
					}]
				});

				this.children = [
					{
						type: 'view',
						className: 'navBarGradient',
						backgroundColor: barColor
					},
					this._navBar,
					{
						type: 'view',
						className: 'navBaredContent',
						children: this.children
					}
				];
				
				if(this.rightNavButton){
					this.setRightNavButton(this.rightNavButton);
				}
				if(this.rightNavButton){
					this.setLeftNavButton(this.leftNavButton);
				}				
			}

			this._super(o);
		},
		
		_setNavButton: function(navButton, rightLeft){
			var navButtonOptions = navButton._opts || navButton,
				navButtonClass = (rightLeft || 'right') + 'NavButton',
				navButtonName = '_' + navButtonClass,
				separatorName = navButtonName + 'Separator';
				
			navButtonOptions.className = (navButtonOptions.className||"") + " " + navButtonClass + " navButton";
			K.log('r', navButtonOptions);
			
			if(this[navButtonName]){
				this._navBar.remove(this[navButtonName]);
			}
			
			this[navButtonName] = K.createButton(navButtonOptions);
			
			if(!this[separatorName]){
				this[separatorName] = K.createView({
					top: 0,
					width: 2,
					height: 44,
					backgroundImage: 'images/android-navbar-separator.png'
				});
				this._navBar.add(this[separatorName]);
			}
			this[separatorName][rightLeft||'right'] = this[navButtonName].width;
			
			this._navBar.add(this[navButtonName]);
			//K.alert(1);
			K.log(' ================================== setnavbutton');
		},
		
		setRightNavButton: function(navButton){
			this._setNavButton(navButton, 'right');
		},
		
		setLeftNavButton: function(navButton){
			this._setNavButton(navButton, 'left');
		}
	});
	

	// Shim the toolbar module
	K['createToolbar'] = K.creators['toolbar'] = function(opts){
		var	toolbarWidth = opts.width||K.getStyle({ type: 'toolbar', className: opts.className }).width||320,
			numSpacers = 0,
			widthSum = 0;
				
		(opts.items||[]).forEach(function(o, i){
			if(o === 'spacer'){
				numSpacers++;
				return o;
			} else {
				var itemWidth = o.width || K.getStyle({
					type: o.type,
					className: (o.className||o.cls||'') + ' toolbarItem'
				}).width;
				
				if(itemWidth){
					widthSum += itemWidth;
				} else {
					numSpacers++;
				}
			}
		});
		
		var left = 0,
			spacerWidth = (toolbarWidth - widthSum)/numSpacers;
		
		var items = [];
		(opts.items||[]).forEach(function(o, i){
			if(o === 'spacer'){
				left += spacerWidth;
			} else {
				if(typeof o === 'string'){
					o = { type: 'label', text: o, width: spacerWidth };
				}
				o.className = (o.className||'') + ' toolbarItem';

				o.left = left;
				o.width = o.width || K.getStyle({
					type: o.type,
					className: (o.className||o.cls||'') + ' toolbarItem'
				}).width || spacerWidth;
				
				var el = K.create(o);

				left += el.width||0;
				
				items.push(el);
			}
		});
		
		var toolbar = K.createView(K.extend({
			height: 44,
			width: toolbarWidth,
			className: 'toolbar',
			children: items
		}, opts));
		
		return toolbar;
	};

}

})();