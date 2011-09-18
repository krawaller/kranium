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
				var collection = this.getCollection();
				var el = model.el, key;

				var recreate = false,
					changed = model.changedAttributes();

				if(el){
					for(key in changed){
						if(typeof el[key] === 'undefined'){
							recreate = true;
						}
					}

					if(!recreate){
						for(key in changed){
							el[key] = changed[key];
						}
					} else {
						var $el = K(el);
						$el.children().remove();
						$el.append((model.el = K.creators[model.type](model.attributes)));
					}
				} else {
					model.el = K.creators[model.type](model.attributes)
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
			
				if(typeof o._inst !== undefined){
					collectionsByInst[o._inst] = collection;
				}
				
				delete this.collection;
				delete o.collection;
				
				this._super(o);
					
				this.model && this.model.bind('change', this.renderModel.bind(this));
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