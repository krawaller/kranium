//TODO: make event delegating more backboney

(function(global){
	
	// Function returning constructor string from type string
	var rrep = /^(\w)(\w+)/,
		rfunc = function($0, $1, $2){
			return $1.toUpperCase() + $2;
		};

	var creators = {};
	K.creators = creators;	
	
	function defaultInit(o){
		//Ti.API.log('defi', { o: o, t: this });
		var t = extend({}, this, { collection: false });
		var el = (creators[this.type]||K.create)(o ? extend(t, o) : t);
		el._props = o;
	    return (this.el = el);
	}

	function forceLoad(){
		Ti.UI.create2DMatrix(); Ti.UI.create3DMatrix(); Ti.UI.createActivityIndicator(); Ti.UI.createAlertDialog(); Ti.UI.createAnimation(); Ti.UI.createButton(); Ti.UI.createButtonBar(); Ti.UI.createCoverFlowView(); Ti.UI.createDashboardItem(); Ti.UI.createDashboardView(); Ti.UI.createEmailDialog(); Ti.UI.createImageView(); Ti.UI.createLabel(); Ti.UI.createMaskedImage(); Ti.UI.createOptionDialog(); Ti.UI.createPicker(); Ti.UI.createPickerColumn(); Ti.UI.createPickerRow(); Ti.UI.createProgressBar(); Ti.UI.createScrollView(); Ti.UI.createScrollableView(); Ti.UI.createSearchBar(); Ti.UI.createSlider(); Ti.UI.createSwitch(); Ti.UI.createTab(); Ti.UI.createTabGroup(); Ti.UI.createTabbedBar(); Ti.UI.createTableView(); Ti.UI.createTableViewRow(); Ti.UI.createTableViewSection(); Ti.UI.createTextArea(); Ti.UI.createTextField(); Ti.UI.createToolbar(); Ti.UI.createView(); Ti.UI.createWebView(); Ti.UI.createWindow();
		Ti.UI.iPad.createSplitWindow();
		Ti.UI.iPad.createPopover();
		Ti.UI.iPhone.createNavigationGroup();
		
		Ti.Map.createMapView();
		Ti.Map.createAnnotation();
		
		Ti.UI.iPhone.SystemButtonStyle.BORDERED;
		Ti.UI.iPhone.TableViewStyle.GROUPED;
		
		Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
		Ti.UI.iPhone.ActivityIndicatorStyle.BIG;
	}

	var defaultCreators = {};
	
	var extraCreators = {
		TableViewRow: 'Row',
		TableViewSection: 'Section',
		ImageView: 'Image',
		MapView: 'Map',
		ActivityIndicator: 'Indicator'
	};
	
	var moduleByType = {
		splitwindow: Ti.UI.iPad,
		navigationgroup: Ti.UI.iPhone,
		popover: Ti.UI.iPad,
		mapview: Ti.Map,
		annotation: Ti.Map
		// Add media modules
	};
	
	var factoryModifier = {
		mapview: 'View'
	};
	
	function functionifyEventString(fn, to){
		if(typeof fn === 'string') { 
			return function(e){
				var value = e.value, 
					s = e.source,
					c;
					
				switch(s&&s._type){
					case 'tabbedbar':
						value = s.labels[e.index];
						break;
				}
				value = (value && value.value)||value;
				e.value = value;
								
				if(to && to[fn]){
					to[fn](e);
				} else {
					(to||Ti.App).fireEvent(fn, K.extend({ value: value }, e).sanitize(["type", "source"]));
				}
				
				/*Ti.API.log('going to fire', { fn: fn, to: to, value: value });
				(to||Ti.App).fireEvent(fn, K.extend({ value: value }, e).sanitize(["type", "source"])); */
			} 
		} else {
			return fn
		}
	}
	
	var extend = K.extend;
	["2DMatrix", "3DMatrix", "ActivityIndicator", "AlertDialog", "Animation", "Annotation", "Button", "ButtonBar", "CoverFlowView", "DashboardItem", "DashboardView", "EmailDialog", "ImageView", "Label", "MapView", "MaskedImage", "NavigationGroup", "OptionDialog", "Picker", "PickerColumn", "PickerRow", "Popover", "ProgressBar", "ScrollView", "ScrollableView", "SearchBar", "Slider", "SplitWindow", "Switch", "Tab", "TabGroup", "TabbedBar", "TableView", "TableViewRow", "TableViewSection", "TextArea", "TextField", "Toolbar", "View", "WebView", "Window"].forEach(function(t){
		var type = t.toLowerCase(),
			module = moduleByType[type]||Ti.UI,
			factoryString = 'create' + (factoryModifier[type]||t),
			extra,
			_silent = false;

			global[t] = K.classes[type] = Class.extend({
		        type: type,
		        init: defaultInit
			});

		K[factoryString] = K.creators[type] = function(opts){
			opts = opts||{};
			if(opts._type){ return opts; }
			if(opts.silent === true){ _silent = true; }
			var o = extend(K.getStyle(opts, type), opts), 
				silent = (silent||o.silent), 
				children, 
				cls, 
				id;

			if(o.children){
				if(K.isFunc(o.children)){ children = o.children(); } 
				else { children = o.children; }
				delete o.children;
			}

			if(o.id){
				id = o.id;
				delete o.id;
			}
			switch(type){
				case 'window':
					if(o.rightNavButton){ o.rightNavButton = K.create(o.rightNavButton, { type: 'button' }); }
					if(o.leftNavButton){ o.leftNavButton = K.create(o.leftNavButton, { type: 'button' }); }
					break;
					
				case 'tableviewrow':
					if(o.leftImage && /^http/.test(o.leftImage)){
						(children||[]).push({ type: 'imageView', image: o.leftImage, className: 'leftImage' });
						delete o.leftImage;
					}
					break;

				case 'tableview':
					//o.data = K.create(o.data||[]);
					o.data = o.data ? K.create(o.data, { type: 'row' }) : [];
					
					if(o.footerView){ o.footerView = K.createView(o.footerView); }
					if(o.headerView){ o.headerView = K.createView(o.headerView); }
					if(o.search){ o.search = K.createSearchBar(o.search); }
					break;

				case 'tableviewsection':
					if(K.isFunc(o.rows)){ o.rows = o.rows(); }
	 				if(o.headerTitle){ o.headerView = K.createView({ className: 'headerView', children: [{ type: 'label', text: o.headerTitle, className: 'headerLabel' }, { type: 'view', className: 'headerBack' }] }); }
					delete o.headerTitle;
					if(o.headerPlain){ o.headerTitle = o.headerPlain; }
					o.rows = (o.rows || []).map(K.createTableViewRow);
					if(K.is.android){
						var sectionRows = o.rows;
						delete o.rows;
					}
					break;

				case 'toolbar':
					o.items = (o.items || []).map(function(child){
						if(child === 'spacer' || child === 'flexSpace'){ child = { systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }; }
						if(typeof child === 'string'){
							child = {
								type: child
							};
						}
						
						if(!(child.className)){
							child.className = 'toolbarButton';
						}
						return K.create(child, { type: 'button' });
					});
					break;

				case 'tab':
					o.window = K.create(o.window, { type: 'window' });
					break;

				case 'tabgroup':
					if(K.is.ios){
						o.tabs = K.create(o.tabs, { type: 'tab' });
					} else {
						o._tabs = o.tabs;
						delete o.tabs;
					}
					break;
					
				case 'splitwindow':
					o.masterView = K.create(o.masterView, { type: 'navigationgroup' });
					o.detailView = K.create(o.detailView, { type: 'navigationgroup' });
					break;
					
				case 'navigationgroup':
					o.window = K.createWindow(o.window);
					break;
					
				case 'scrollableview':
					o.views = K.create(o.views);
					break;
					
			}

			delete o.type;
			if(typeof o.intype !== 'undefined'){
				o.type = o.intype;
				delete o.intype;
			}
			var el = module[factoryString](o);
			el._uuid = ++uuid;
			el._type = type;
			el._opts = opts;
			el._id = id;

			switch(type){
				case 'activityIndicator':
					el.show();
					break;

				case 'tabgroup':
					if(o._tabs){ 
						o._tabs.forEach(function(tab){
							el.addTab(K.createTab(tab));
						});
					}
					break;
					
				case 'picker':
					(o.rows||[]).forEach(function(row){

						var pickerRow = K.createPickerRow(
							(row.title && Object.keys(row) > 1) || el.addRowClass ?
							{ _title: row.title, children: [K.extend({ type: 'label', text: row.title, className: el.addRowClass, width: 'auto', height: 'auto' }, row)] } : 
							row
						);

						Ti.API.log('pr', { el: pickerRow, children: pickerRow.children })

						el.add(
							pickerRow
						);
					});
					break;
				
				case 'tableviewsection':
					K.log('heeeere');
					if(K.is.android){
						sectionRows.forEach(function(row){
							K.log(['TRYING TO ADD', row, 'TO', el])
							el.add(row);
						});
					}
					break;
					
				case 'window':
					if(o.loadify){ K.loadify(el); }
					break;
					
				case 'textfield':
				case 'textarea':
					el.addEventListener('focus', function(e){
						K._focusedField = el;
					});
					break;
			}

			(children || []).forEach(function(child){
				//child.parentNode = el;
				el.add(K.create(child));
			});

			if(!_silent){
				if((classes = (o.className || o.cls))){
					classes.split(/\s+/).forEach(function(cls){
						if(cls){
							(K.elsByClassName[cls] = K.elsByClassName[cls] || []).push(el); 
						}
					});
				}
				if(id){ K.elsById[id] = el; }
				(K.elsByName[type] = K.elsByName[type] || []).push(el);
				//els.push(el);
			}

			o.events && (o.events = o.events.clone()); // Hmm... must treat input objects as immutable
			if((fn = o.click)){
				(tmp = (o.events = o.events||{})).click ? ((Array.isArray(tmp.click) ? tmp.click.push(fn) : (tmp.click = [tmp.click, fn]) )) : (tmp.click = fn);				
			}
			if(o.events){
				var scope = o.events.scope||el, fn, name, toName, to, m, events = {};
				delete o.events.scope;
				var appEvents = o.events.app;
				delete o.events.app;
				
				for(name in o.events){
					(events[name]=events[name]||[]).push({ fn: o.events[name] });
				}
				for(name in appEvents){
					(events[name]=events[name]||[]).push({ fn: appEvents[name], appEvent: true });
				}
				for(name in events){
					events[name].forEach(function(event){
						var value = event.fn,
							bindTo = event.appEvent ? Ti.App : el,
							fn;

						if( (typeof value === 'string') ){
							if(m = value.match(/^([.#]\S+)\s+(.+)$/)){
								toName = m[2];
								to = (tmp = $$(m[1])) && tmp[0]||tmp;
							} else {
								toName = value;
								to = el;
							}

							fn = functionifyEventString(toName, to);								
							bindTo.addEventListener(name, fn);
						} else {
							fn = functionifyEventString(value);
							bindTo.addEventListener(name, scope ? fn.bind(scope) : fn);
						}
					});
				}
				/*for(name in appEvents){
					fn = functionifyEventString(app[name]);
					Ti.App.addEventListener(name, scope ? fn.bind(scope) : fn);
				}*/
				
				var br = o.events.beforerender;
				br && ((typeof br === 'string') ? (el[br] && el[br]({}))||el.fireEvent(br) : br.call(el));
			}

			if(opts.silent === true){ _silent = false; }
			return el;
		};
		
		if((extra = extraCreators[t])){
			var extraType = extra.toLowerCase();
			global[extra] = K.classes[extraType] = Class.extend({
		        type: type,
		        init: defaultInit
			});
			
			K['create' + extra] = creators[extraType] = creators[type];
		}
	});

	K._wrapCustomCreator = function(creator, type){
		return function(o){		
			delete o.type;
			var obj = (new creator(o)).el;

			if(!obj._type){
				obj = K.creators[(obj.type||'view')](obj);
			};
			(K.elsByName[type]||(K.elsByName[type] = [])).push(obj);
			return obj;
		}
	}
	
	var jadeMatcher = /^\s*<([^$]+?)>?\s*$/;
	K.create = function(o, def){
		if(o instanceof Array){ return o.map(function(el){ return K.create(el, def); }); }
		if(o && o._type){ return o; }
		
		var obj;
		if(typeof o === 'string'){
			var jadeStr;
			if( (/\.jade$/.test(o) && (jadeStr = K.file('jade/' + o)) ) || (jadeStr = (o.match(jadeMatcher)||[false,false])[1]) && jadeStr){

				obj = K.jade(jadeStr)();
				if(obj && obj.length === 1){
					obj = obj[0];
				}
				obj = K.create(obj);
			} else {
				o = { type: o.toLowerCase() };
			}			
		}
		
		if(!obj){
			if(def && typeof def === 'object'){
				o = K.extend({}, def, o);
			}

			var type = o&&o.type;

			if(!type){
				Ti.API.log('Missing type', [o, type]);
				return K.createLabel({ text:'mtype' });
			}

			if(type && !K.creators[type]){
				//K.loadStyle(type);

				(function(){
					//Ti.API.log('requiring in creator', type);
					var creator = K.loadClass(type)||function(){ Ti.API.error(type + ' not available'); };
					K.classes[type] = creator;
					//obj = (K.creators[type] = wrapCustomCreator(creator, type))(m||o);
					obj = K._wrapCustomCreator(creator, type)(o);
				})();
			} else {
				obj = (K.creators[type])(o);
			}
		}

		return obj.el||obj;
	};
	
})(this);