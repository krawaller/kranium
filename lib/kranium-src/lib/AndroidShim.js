exports.AndroidShim = function(K, global){
		
	if(K.is.android){
	
		K.Style.style('/kranium/lib/kss/androidshim.kss');
	
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

				var	labelWidth = (dipToPx(opts.width) || Ti.Platform.displayCaps.platformWidth) / opts.labels.length,
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
						
							events.touchcancel = function(){
								if(type === 'tabbedbar' && bar.index === i){ return; }
								this.backgroundColor = backgroundColor;
							}
						}
						o.className = (o.className||'') + ' ' + camelized + 'Label';

						return K.create(K.extend({
							width: labelWidth,
							left: labelWidth*i,
							events: events
						}, o, { top: 0, bottom: 0, height: null }));

					});


				var separators = [];
				labels.forEach(function(label, i){
					if(i > 0){
						separators.push(K.createView({
							top: 0,
							width: 2,
							bottom: 0,
							left: labelWidth*i - 1,
							backgroundImage: '/kranium/lib/images/android-navbar-separator.png'
						}));
					}
				});

				var style = K.getStyle(null, type);
				var bar = K.createView(K.extend({
					index: 0,
					height: '44dp',
					children: labels.concat(separators)
				}, style, opts));
				return bar;
			};
		}
	
		K['createTabbedBar'] = K.creators['tabbedbar'] = createSegmentedCreator('tabbedbar');
		K['createButtonBar'] = K.creators['buttonbar'] = createSegmentedCreator('buttonbar');
	
		// Shim the window module with pretty navbars with left- and rightNavButtons.
		K.UI.Window = K.classes['window'] = K.Class.classes['window'] = K.UI.Window.extend({
			init: function(o){
				if(!this.navBarHidden && (typeof this.useCustomAndroidNavBar !== 'undefined' ? this.useCustomAndroidNavBar : K.Settings.useCustomAndroidNavBar) && (this.title || this.leftNavButton || this.rightNavButton)){
					this.navBarHidden = true;

					this._navBarLabel = K.create({
						type: 'label',
						className: 'navBarLabel',
						text: this.title || ''
					});

					var barColor = K.getStyle(null, 'window').barColor;
					this._navBar = K.create({
						type: 'view',
						className: 'navBar',
						backgroundImage: '/kranium/lib/images/android-navbar-overlay.png',
						children: [this._navBarLabel],
						zIndex: 1337
					});
					
					this.children = o.children = [
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
					if(this.leftNavButton){
						this.setLeftNavButton(this.leftNavButton);
					}
					
				}

				this._super(o);
			},
		
			_setNavButton: function(navButton, rightLeft){
				var navButtonOptions = K.extend({}, (navButton && navButton._opts) || navButton),
					navButtonClass = (rightLeft || 'right') + 'NavButton',
					navButtonName = '_' + navButtonClass,
					separatorName = navButtonName + 'Separator';
				
				if(!navButton){
					if(navButton == null){
						if(this[navButtonName]){
							this._navBar.remove(this[navButtonName]);
							this[navButtonName] = null;
						}
						
						if(this[separatorName]){
							this._navBar.remove(this[separatorName]);
							this[separatorName] = null;
						}
					}
					return;
				}
				
				navButtonOptions.className = (navButtonOptions.className||"") + " " + navButtonClass + " navButton";
			
				if(this[navButtonName]){
					this._navBar.remove(this[navButtonName]);
				}
				
				if(navButtonOptions.image){
					var navButtonImage = navButtonOptions.image;
					delete navButtonOptions.image;
				}
				
				var button = K.createButton(navButtonOptions),
					buttonWrapper = K.createView({
						className: 'navButton ' + navButtonClass
					});
				
				if(navButtonImage){
					buttonWrapper.add(K.create({
						type: 'image',
						touchEnabled: false,
						image: navButtonImage,
					}));
				}
				
				buttonWrapper.add(button);
				
				this[navButtonName] = buttonWrapper; //K.createButton(navButtonOptions);
			
				if(!this[separatorName]){
					this[separatorName] = K.createView({
						className: 'navBarSeparator'
					});
					this._navBar.add(this[separatorName]);
				}
				this[separatorName][rightLeft||'right'] = this[navButtonName].width;
			
				this._navBar.add(this[navButtonName]);
			},
		
			setRightNavButton: function(navButton){
				this._setNavButton(navButton, 'right');
			},
		
			setLeftNavButton: function(navButton){
				this._setNavButton(navButton, 'left');
			},
			
			setTitle: function(str){
				if(this._navBarLabel){
					this._navBarLabel.text = str;
				}
			}
		});
	

		// Shim the toolbar module
		K['createToolbar'] = K.creators['toolbar'] = function(opts){
			var	toolbarWidth = opts.width||K.getStyle({ type: 'toolbar', className: opts.className }).width || Ti.Platform.displayCaps.platformWidth,
				numSpacers = 0,
				widthSum = 0;
				
			(opts.items||[]).forEach(function(o, i){
				if(o === 'spacer'){
					numSpacers++;
					return o;
				} else {
					var itemWidth = dipToPx(o.width || K.getStyle({
						type: o.type,
						className: 'toolbarItem ' + (o.className||o.cls||'')
					}).width);
				
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
					o.className = 'toolbarItem ' + (o.className||'');

					o.left = left;
				
					var width = dipToPx(o.width || K.getStyle({
						type: o.type,
						className: 'toolbarItem ' + (o.className||o.cls||'')
					}).width || spacerWidth);
					o.width = width;
				
					var el = K.create(o);
					left += dipToPx(el.width||0);
					items.push(el);
				}
			});
		
			var toolbar = K.createView(K.extend({
				height: '44dp',
				width: toolbarWidth,
				className: 'toolbar',
				children: items
			}, opts));
		
			return toolbar;
		};


		function dipToPx(str){
			var parts = String(str).match(/^([\d\.]+)(\w*)$/),
				value;
		
			if(parts){
				value = parts[2] == 'dp' || parts[2] == 'dip' ? 
					Math.round(Ti.Platform.displayCaps.dpi / 160 * parts[1]) : 
					Number(parts[1]);
			} else {
				value = 0;
			}

			return value;
		}

		// Custom tabGroup
	
		var zIndexCounter = 1;
	
		function Tab(opts, tabGroup){			
			var me = this,
				i = tabGroup.tabs.length,
				isLast = tabGroup.getNumberOfTabs() === i,
				isFirst = i === 0,
				width = tabGroup._getTabWidth();

			this.tabIndex = i;
		
			this._tabButton = K.createView({
				width: width,
				className: 'tabButton',
				left: width * i,
				children: [{
					type: 'label',
					className: 'tabButtonLabel tabButtonLabel' + (opts.icon ? 'With' : 'Without') + 'Icon',
					text: opts.title || (opts.title + 'i'),
					touchEnabled: false
				}]
				.concat(!isFirst ? [(this._tabSeparator = K.createView({
					className: 'tabButtonSeparator',
					touchEnabled: false
				}))] : [])
				.concat(opts.icon ? [{
					type: 'image',
					image: opts.icon,
					className: 'tabButtonIcon',
					touchEnabled: false
				}] : []),
				//click: this.activate.bind(this),
				events: {
					click: this.activate.bind(this),
					touchstart: function(e){
						if(me.isActiveTab){ return; }
						me.setState('pressed');
					},
					touchend: function(e){
						if(me.isActiveTab){ return; }
						me.setState('active');
					},
					touchcancel: function(e){
						if(me.isActiveTab){ return; }
						me.setState('inactive');
					}
				}
			});
		
			this.tabGroup = tabGroup;
			this.tabGroup._tabButtonContainer.add(this._tabButton);
		
			this.opts = opts;
			this.setState('inactive');
		
			if(K.UI.isQueryable(opts)){
				(K.elsByName['tab']||(K.elsByName['tab'] = [])).push(this);
			}
			
		}
	
		Tab.prototype.activate = function(){
			var opening = false;
			if(!this.window){
				opening = true;
				
				var fromBottom = K.getStyle({ type: 'tab' }).height || K.getStyle({ type: 'tabBar' }).height || '50dp';
					defaults = { left: 0, right: 0, top: 0, bottom: fromBottom, zIndex: ++zIndexCounter },
					opts = K.extend(this.opts.window, defaults);
				
				if(opts.type === 'window'){
					opts.type = 'view';
				}
				
				this.window = K.create(opts, { type: 'view', forceType: 'view' });
				//this.window = (new K.UI.Window(opts)).el;
				if(this.window._type === 'window'){
					var children = null;
					
					if(this.window.children && this.window.children.length === 0){
						children = (this.window._opts && this.window._opts.children) || [];
					}
					
					var view = K.createView(K.extend({}, this.window._opts, opts, { children: children, type: null })),
						child;
											
					if(this.window.children && this.window.children.length !== 0){

						children = this.window.children;
						
						for(var i = 0; i < children.length; i++){
							child = children[i];
							view.add(child);
						}
					}
				
					this.window = view;
				}

				this.tabGroup._container.add(this.window);
			}
		
			this.tabGroup.index = this.tabIndex;
			if(this !== this.tabGroup.activeTab){
				this.window.left = 0;
				

				this.setState('active');
				this.window.show();
				this.window.fireEvent('focus');
				
				if(this.tabGroup.activeTab){ 
					this.tabGroup.activeTab.window.hide();
					this.tabGroup.activeTab.window.fireEvent('blur');
					this.tabGroup.activeTab.isActiveTab = false;
				}

				this.isActiveTab = true;
				this.tabGroup.activeTab = this;
				
			} else {
				this.window.fireEvent('home');
			}
			
			if(opening){
				this.window.fireEvent('open');
			}
		
		};
	
		Tab.prototype.setState = function(state){
			switch(state){
				case 'pressed':
					this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonPressed' }).backgroundImage;
					break;
				
				case 'active':
					this.tabGroup.activeTab && this.tabGroup.activeTab.setState('inactive');
					this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonActive' }).backgroundImage;
					break;
			
				case 'inactive':
					this._tabButton.backgroundImage = K.getStyle({ className: 'tabButtonInactive' }).backgroundImage;
					break;
			}
		};
	
		Tab.prototype.open = function(win){	
			win.open({ fullscreen: false });
		};
	
		Tab.prototype.setSeparatorColor = function(color){
			this._tabSeparator && (this._tabSeparator.backgroundColor = color);
		};
	
	
		function TabGroup(opts){
			var me = this,
				pauseListener = opts && opts.events && opts.events.pause,
				resumeListener = opts && opts.events && opts.events.resume,
				resumedListener = opts && opts.events && opts.events.resumed,
				openListener = opts && opts.events && opts.events.open,
				destroyListener = opts && opts.events && opts.events.destroy;

			this.onOpenCallbacks = [];
			this.tabs = [];

			this._tabButtonContainer = K.create({
				type: 'view',
				className: 'tabButtonContainer',
				//visible: false
			});

			var stopCounter = 0,
				resumeCounter = 0;
				
			this._container = K.createWindow({
				className: 'tabGroupWindow ' + (opts.className || ''),
				id: opts.id || null,
				queryable: opts.queryable || null,
				navBarHidden: true,
				exitOnClose: true,
				windowSoftInputMode: Ti.UI.Android && Ti.UI.Android.SOFT_INPUT_ADJUST_PAN,
				children: [this._tabButtonContainer],
				setActiveTab: this.setActiveTab.bind(this),
				getActiveTabIndex: this.getActiveTabIndex.bind(this),
				//backgroundColor: '#00f',
				events: {
					open: function(e){
						me.setActiveTab(opts.index || 0);
						if(K.is.android){
							Ti.Gesture.addEventListener('orientationchange', me._onOrientationChange.bind(me));

							Ti.Android.currentActivity.addEventListener('stop', function(e){
								if(typeof pauseListener === 'function'){
									pauseListener.call(me._container);
								}
								me._container.fireEvent('pause');
							});

							Ti.Android.currentActivity.addEventListener('resume', function(e){
								if(typeof resumeListener === 'function'){
									resumeListener.call(me._container);
								}
								if(typeof resumedListener === 'function'){
									resumedListener.call(me._container);
								}
								me._container.fireEvent('resume');
								me._container.fireEvent('resumed');
							});

							Ti.Android.currentActivity.addEventListener('destroy', function(e){
								me._container.fireEvent('destroy');
								if(typeof destroyListener === 'function'){
									destroyListener.call(me._container);
								}
							});

							if(typeof openListener === 'function'){
								openListener.call(me._container);
							}
						}
						
					
					}
				}
			});
		
			this._tabs = opts.tabs;
		
		
			(opts.tabs || []).forEach(function(o, i, arr){
				me.addTab(o, true);
			});
		
			var windowStyle = K.getStyle({ type: 'window' }),
				tabGroupStyle = K.getStyle({ type: 'tabGroup', className: 'tabButtonContainer' }),
				tabStyle = K.getStyle({ type: 'tab' });
		
			this.setBackgroundColor(windowStyle.barColor || tabGroupStyle.backgroundColor || tabStyle.backgroundColor || '#aaa');
			this.repaint();
		
			if(K.UI.isQueryable(opts)){
				(K.elsByName['tabgroup']||(K.elsByName['tabgroup'] = [])).push(this);
			}
		}
	
		TabGroup.prototype.open = function(){
			var me = this;
			this._container.open();
		};
	
		TabGroup.prototype.close = function(){
			var me = this;
			this._container.close();
		};
	
		TabGroup.prototype.getNumberOfTabs = function(){
			return (this.tabs && this.tabs.length) || (this._tabs && this._tabs.length) || 0;
		};
	
		TabGroup.prototype.setActiveTab = function(n){
			this.tabs[n] && this.tabs[n].activate();
			this.index = this._container.index = n;
		};
		
		TabGroup.prototype.getActiveTab = function(n){
			return this.tabs[n];
		};
	
		TabGroup.prototype.getActiveTabIndex = function(n){
			return this.index;
		};

	
		TabGroup.prototype._getTabWidth = function(){
			return Math.ceil(Ti.Platform.displayCaps.platformWidth / this.getNumberOfTabs());
		};
	
		TabGroup.prototype.repaint = function(){
			/*if(!this._statusBarHeight){
				var winHeight = this._container.height,
					height = Ti.Platform.displayCaps.platformHeight;
				
				this._statusBarHeight = (height - winHeight) || 0;			
			}
		
			this._tabButtonContainer.top = Ti.Platform.displayCaps.platformHeight - this._statusBarHeight - dipToPx(this._tabButtonContainer.height);*/
		
			var width = this._getTabWidth();
			this.tabs.forEach(function(tab, i){
				tab._tabButton.width = width;
				tab._tabButton.left = width * i;
			});		
		};
	
		TabGroup.prototype._onOrientationChange = function(e){
			this._orientation = e.orientation;
			this.repaint();
		};

		TabGroup.prototype.setBackgroundColor = function(color){
			this._tabButtonContainer.backgroundColor = color;
			this.tabs.forEach(function(tab){
				tab.setSeparatorColor(color);
			});
		};
		TabGroup.prototype.setBarColor = TabGroup.prototype.setBackgroundColor;

		TabGroup.prototype.addTab = function(tab, skipRepaint){
			if(!(tab instanceof Tab)){
				tab = new Tab(tab, this);
			}
			this.tabs.push(tab);
			if(!skipRepaint){
				this.repaint();
			}
		}

		var tabGroup;
		K.createTabGroup = K.creators['tabgroup'] = function(opts){
			return new TabGroup(opts);
		};
	
		K.createTab = K.creators['tab'] = function(opts){
			return new Tab(opts);
		};
		

	}
};