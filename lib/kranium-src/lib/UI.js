var expose = {
	create: 'create',
	getInst: 'getInst',
	creators: 'creators',
	
	elsByClassName: 'elsByClassName',
	elsById: 'elsById',
	elsByName: 'elsByName'
	
};
exports.__expose = expose;

exports.UI = function(K, global){
	
	var UI = {};
	
	/**
	 * Define variables
	 */
	var rrep = /^(\w)(\w+)/,
		creators = {};
	
	UI.creators = creators;
	/**
	 * Default creation function used when subclassing basic element types
	 *
	 * @param {Object} o
	 * @returns {K.UI.Module}
	 */
	function defaultInit(o){
		var props = extend({}, this, o),
			el = (creators[this.type]||UI.create)(props);

		el._props = props;
	    return (this.el = el);
	}

	/**
	 * Force Titanium to load basic types
	 */
	function forceLoad(){
		Ti.UI.create2DMatrix();
		Ti.UI.create3DMatrix();
		Ti.UI.createActivityIndicator();
		Ti.UI.createAlertDialog();
		Ti.UI.createAnimation();
		Ti.UI.createButton();
		Ti.UI.createButtonBar();
		Ti.UI.createCoverFlowView();
		Ti.UI.createDashboardItem();
		Ti.UI.createDashboardView();
		Ti.UI.createEmailDialog();
		Ti.UI.createImageView();
		Ti.UI.createLabel();
		Ti.UI.createMaskedImage();
		Ti.UI.createOptionDialog();
		Ti.UI.createPicker();
		Ti.UI.createPickerColumn();
		Ti.UI.createPickerRow();
		Ti.UI.createProgressBar();
		Ti.UI.createScrollView();
		Ti.UI.createScrollableView();
		Ti.UI.createSearchBar();
		Ti.UI.createSlider();
		Ti.UI.createSwitch();
		Ti.UI.createTab();
		Ti.UI.createTabGroup();
		Ti.UI.createTabbedBar();
		Ti.UI.createTableView();
		Ti.UI.createTableViewRow();
		Ti.UI.createTableViewSection();
		Ti.UI.createTextArea();
		Ti.UI.createTextField();
		Ti.UI.createToolbar();
		Ti.UI.createView();
		Ti.UI.createWebView();
		Ti.UI.createWindow();
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
	
	/**
	 * Map some types to easier names too
	 */
	var extraCreators = {
		TableViewRow: 'Row',
		TableViewSection: 'Section',
		ImageView: 'Image',
		MapView: 'Map',
		ActivityIndicator: 'Indicator'
	};
	
	/**
	 * Direct type to correct Ti module
	 */
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
	
	/**
	 * Optionally redirect event callbacks
	 */
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
			};
		} else {
			return fn;
		}
	}
	
	var extend = K.extend;
	var uuid = 1;
	
	UI.elsByClassName = {};
	UI.elsById = {};
	UI.elsByName = {};
	
	
	var Settings = K.Settings;
	/**
	 * Define creators
	 */
	[
		"2DMatrix", "3DMatrix", "ActivityIndicator", "AlertDialog", "Animation", 
		"Annotation", "Button", "ButtonBar", "CoverFlowView", "DashboardItem", 
		"DashboardView", "EmailDialog", "ImageView", "Label", "MapView", 
		"MaskedImage", "NavigationGroup", "OptionDialog", "Picker", "PickerColumn", 
		"PickerRow", "Popover", "ProgressBar", "ScrollView", "ScrollableView", 
		"SearchBar", "Slider", "SplitWindow", "Switch", "Tab", "TabGroup", 
		"TabbedBar", "TableView", "TableViewRow", "TableViewSection", "TextArea", 
		"TextField", "Toolbar", "View", "WebView", "Window"
	]
	.forEach(function(t){
		var type = t.toLowerCase(),
			elType = type,
			module = moduleByType[type]||Ti.UI,
			factoryString = 'create' + (factoryModifier[type]||t),
			extra,
			_silent = false;

			UI[t] = K.Class.classes[type] = K.Class.extend({
		        type: type,
		        init: defaultInit
			});

		

		/**
		 * Expose and define creators
		 */
		UI[factoryString] = creators[type] = exports.__expose[factoryString] = function(opts){
			var customType;
			opts = opts || {};
			
			if(opts._type){
				if(typeof opts.toString === 'function' && (/^\[object Ti/).test(opts.toString())){
					return opts;
				} else {
					customType = opts._type;
				}
			}
			
			if(opts.silent === true){ _silent = true; }
			
			var o = extend(K.Style.get(opts, type, customType), opts), 
				silent = (silent||o.silent),
				queryable = UI.isQueryable(o),
				children, 
				cls, 
				id,
				events;

			if(o.events){
				events = K.extend(true, {}, o.events);
			}

			if(o.click){
				if(typeof events !== 'object'){
					events = {};
				}
				events.click = o.click;
			}

			if(o.children){
				if(K.isFunc(o.children)){ children = o.children(); } 
				else { children = o.children; }
				delete o.children;
			}

			if(o.id){
				id = o.id;
				delete o.id;
			}
			
			/**
			 * Handle types pre-construct
			 */
			switch(type){
				case 'window':
					if(o.rightNavButton){ o.rightNavButton = create(o.rightNavButton, { type: 'button' }); }
					if(o.leftNavButton){ o.leftNavButton = create(o.leftNavButton, { type: 'button' }); }
					break;
					
				case 'tableviewrow':
					if(o.leftImage && (/^http/).test(o.leftImage)){
						(children||[]).push({ type: 'imageView', image: o.leftImage, className: 'leftImage' });
						delete o.leftImage;
					}
					break;

				case 'tableview':
					o.data = o.data ? create(o.data, { type: 'row' }) : [];
	
					if(o.footerView){ o.footerView = create(o.footerView); }
					if(o.headerView){ o.headerView = create(o.headerView); }
					if(o.search){ o.search = UI.createSearchBar(o.search); }
					break;

				case 'tableviewsection':
					if(K.isFunc(o.rows)){ o.rows = o.rows(); }

					if(o.footerView){ o.footerView = create(o.footerView); }
					if(o.headerView){ o.headerView = create(o.headerView); }

	 				if(o.headerTitle){ o.headerView = UI.createView({ className: 'headerView', children: [{ type: 'label', text: o.headerTitle, className: 'headerLabel' }, { type: 'view', className: 'headerBack' }] }); }
					delete o.headerTitle;
					if(o.headerPlain){ o.headerTitle = o.headerPlain; }
					o.rows = (o.rows || []).map(UI.createTableViewRow);
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
						return create(child, { type: 'button' });
					});
					break;

				case 'tab':
					o.window = create(o.window, { type: 'window' });
					break;

				case 'tabgroup':
					if(K.is.ios){
						o.tabs = create(o.tabs, { type: 'tab' });
					} else {
						o._tabs = o.tabs;
						delete o.tabs;
					}
					break;
					
				case 'splitwindow':
					o.masterView = create(o.masterView, { type: 'navigationgroup' });
					o.detailView = create(o.detailView, { type: 'navigationgroup' });
					break;
					
				case 'navigationgroup':
					o.window = create(o.window, { type: 'window' });
					break;
					
				case 'scrollableview':
					o.views = create(o.views);
					break;
					
			}

			/**
			 * Create actual TiObject
			 */
			delete o.type;
			if(typeof o.intype !== 'undefined'){
				o.type = o.intype;
				delete o.intype;
			}
			var el = module[factoryString](o);
			el._uuid = ++uuid;
			el._type = type;
			if(customType){
				el._customType = customType;
			}
			el._opts = opts;
			el._id = id;

			/**
			 * Handle types post-construct
			 */
			switch(type){
				case 'activityIndicator':
					el.show();
					break;

				case 'tabgroup':
					if(o._tabs){ 
						o._tabs.forEach(function(tab){
							el.addTab(UI.createTab(tab));
						});
					}
					break;
					
				case 'picker':
					(o.rows||[]).forEach(function(row){

						var pickerRow = UI.createPickerRow(
							(row.title && Object.keys(row) > 1) || el.addRowClass ?
							{ _title: row.title, children: [K.extend({ type: 'label', text: row.title, className: el.addRowClass, width: 'auto', height: 'auto' }, row)] } : 
							row
						);

						el.add(
							pickerRow
						);
					});
					break;
				
				case 'tableviewsection':
					if(K.is.android){
						sectionRows.forEach(function(row){
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

			/**
			 * Add children
			 */
			(children || []).forEach(function(child){
				//child.parentNode = el;
				el.add(create(child));
			});

			/**
			 * Cache selectables from el if not silent
			 */
			if(queryable){
				if(K.elsByClassName && (classes = (o.className || o.cls))){
					classes.split(/\s+/).forEach(function(cls){
						if(cls){
							(K.elsByClassName[cls] = K.elsByClassName[cls] || []).push(el); 
						}
					});
				}
				if(K.elsById && id){ K.elsById[id] = el; }
				if(K.elsByName){
					(K.elsByName[type] = K.elsByName[type] || []).push(el);
				}
				//els.push(el);
			}
			
			/**
			 * Handle events
			 */
			if(events){
				var appEvents = events.app,
					scope = events.scope || el;

				delete events.app;
				delete events.scope;

				for(name in events){
					el.addEventListener(name, events[name].bind(scope));
				}
				if(appEvents){
					for(name in appEvents){
						Ti.App.addEventListener(name, appEvents[name].bind(scope));
					}
				}

				var br = events.beforerender;
				br && ((typeof br === 'string') ? (el[br] && el[br]({}))||el.fireEvent(br) : br.call(el));
			}

			if(opts.silent === true){ _silent = false; }
			return el;
		};
		
		
		
		
		/**
		 * Alias extra creators
		 */
		if((extra = extraCreators[t])){
			var extraType = extra.toLowerCase();
			global[extra] = K.Class.classes[extraType] = K.Class.extend({
		        type: type,
		        init: defaultInit
			});
			
			K['create' + extra] = creators[extraType] = exports.__expose['create' + extra] = creators[type];
		}
	});

	/**
	 * Wrap custom creators with extra logic
	 *
	 * @param {Function} creator
	 * @returns {Function}
	 */
	var instanceCounter = 0,
		instances = {};
		
	function _wrapCustomCreator(creator, type){
		return function(o){
			
			o._type = type;
			delete o.type;
			
			var inst = ++instanceCounter;
			o._inst = inst;

			var obj = new creator(o),
				el = obj.el;
			
			if(!el._type){
				el = K.creators[(el.type||'view')](el);
			};
			if(UI.isQueryable(obj)){
				(K.elsByName[type]||(K.elsByName[type] = [])).push(el);
			}
			el.inst = obj;

			instances[inst] = obj;
			return el;
		};
	}

	UI.isQueryable = function(o){
		return typeof o.queryable === 'undefined' ? Settings && Settings.queryable : o.queryable;
	};

	/**
	 * Get a Klass instance from a custom object
	 *
	 * @param {Function} creator
	 * @returns {Function}
	 */
	UI.getInst = function(el){
		return instances[el._inst];
	};
	
	/**
	 * Magic element creator. Autoloads custom modules if needed
	 *
	 * @param {Object} o Element blueprint
	 * @param {Object} [def] Default properties to augment each created element with
	 * @returns {TiObject||Array}
	 */
	function create(o, def, overriders){
		if(Array.isArray(o)){ return o.map(function(el){ return create(el, def); }); }
		
		if(o && o._type){ return o; }

		var obj;
		if(typeof o === 'string' || o instanceof String){
			return K.jade(o);		
		}

		if(def && typeof def === 'object'){
			o = K.extend({}, def, o);
		}

		var type = o&&o.type;

		if(!type){
			Ti.API.log('Missing type', [o, type]);
			return UI.createLabel({ text:'mtype' });
		}

		if(type && !K.creators[type]){

			var creator = K.loadClass(type)||function(){ Ti.API.error(type + ' not available'); },
				wrapped = _wrapCustomCreator(creator, type);

			K.Class.classes[type] = creator;
			K.creators[type] = wrapped;
			obj = wrapped(o);

		} else {
			obj = (K.creators[type])(o);
		}

		return obj.el||obj;
	}
	UI.create = create;
	
	
	return UI;
};