// Not ported to 0.2
(function(global){
	
	var collectionsByInst = {};
	
	try {
		
		var backboneInitiated = false;
		var initBackbone = K.initBackbone = function(){
			try {
				Ti.include('/kranium/lib/backbone/underscore.js');
				Ti.include('/kranium/lib/backbone/backbone.js');
			
				var eventSplitter = /^(\w+)\s*(.*)$/;
				_.extend(Backbone.View.prototype, Backbone.Events, {
					tagName: 'view',

					make: function(tagName, attributes, content){
						return K.create({ type: tagName, attr: attributes, content: content });
					},

					delegateEvents: function(events) {
						Ti.API.log('delegately', [events, this.events]);
						if (! (events || (events = this.events))) return;
						$(this.el).unbind();
						for (var key in events) {
							var methodName = events[key];
							var match = key.match(eventSplitter);
							var eventName = match[1],
								selector = match[2];
							var method = _.bind(this[methodName], this);
							Ti.API.log('bindly', [eventName, selector]);
							if (selector === '') {
								$(this.el).bind(eventName, method);
							} else {
								$(this.el).delegate(selector, eventName, method);
							}
						}
					}

				});
			} catch(e){
				Ti.API.error(e);
			}
			
			if(Backbone){
				backboneInitiated = true;
			}
		}
		
		var simpleTypes = ["activityindicator", "alertdialog", "animation", "annotation", "button", "buttonbar", "coverflowview", "dashboarditem", "dashboardview", "emaildialog", "imageview", "label", "mapview", "maskedimage", "navigationgroup", "optiondialog", "picker", "pickercolumn", "pickerrow", "popover", "progressbar", "scrollview", "scrollableview", "searchbar", "slider", "splitwindow", "switch", "tab", "tabgroup", "tabbedbar", "tableview", "tableviewrow", "tableviewsection", "textarea", "textfield", "toolbar", "view", "webview", "window"];
		

		global.BackboneView = View.extend({
			renderCollection: function(){
				var collection = this.getCollection();
				if(collection && collection.map){
					var data = collection.map(function(model){
						return (model.el = K.creators[model.type](K.extend({ _modelId: model.id, _modelCid: model.cid }, model.attributes)));
					});

					this.el.setData(data);
				}
				
			},
			renderModel: function(model) {
				var collection = this.getCollection(),
					opts = {},
					type,
					el,
					key;
				
				if(collection){
					type = model.type;
					el = model && model.el;
				} else {
					opts = this._baseOpts;
					type = this.use || 'label';
					el = model.el;
				}

				var isSimple = simpleTypes.indexOf(type) !== -1,
					recreate = !isSimple,
					changed = model.changedAttributes();

				if(el){
					/*for(key in changed){
						if(typeof el[key] === 'undefined'){
							recreate = true;
						}
					}*/

					if(!recreate){
						for(key in changed){
							el[key] = changed[key];
						}
					} else {
						var $el = K(el),
							$parent = $el.parent();

						$el.remove();
						$parent.append((model.el = K.creators[type](K.extend(opts, model.attributes))));
					}
				} else {
					model.el = K.creators[type](model.attributes);
				}
				
				collection && collection.sort();
				return this;
			},

			getCollection: function(){
				return collectionsByInst[this._inst];
			},

			template: function(o){
				return K.extend({}, this._props, o, { type: this._klass });
			},

			init: function(o){
				
				if(!backboneInitiated){
					initBackbone();
				}
				
				var collection = o.collection || this.collection;
			
				if(collection && typeof o._inst !== undefined){
					collectionsByInst[o._inst] = collection;
				}
				
				delete this.collection;
				delete o.collection;
				
				if(this.model && !collection){
					
					var opts = K.extend({ type: this.use || this.type }, o, this.model.attributes);
					delete opts.model;
					
					this._baseOpts = o;
					this.el = this.model.el = K.create(opts);
				} else {
					this._super(o);
				}
				
					
				if(this.model){
					this.model.bind('change', this.renderModel.bind(this));
				}
				
				if(collection){
					this.renderCollection(collection);

					collection.bind('refresh', this.renderCollection.once(this));
					collection.bind('change', this.renderModel.bind(this));
					collection.bind('add', this.renderCollection.bind(this));

				}

			}

		});
	} catch (e){ Ti.API.error(e); }
})(this);