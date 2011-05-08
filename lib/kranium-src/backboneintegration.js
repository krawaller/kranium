(function(global){
	try {
		Ti.include('/kranium/lib/backbone/kranium-underscore.js');
		Ti.include('/kranium/lib/backbone/kranium-backbone.js');
		Ti.include('/kranium/lib/backbone/kranium-backbone-couchconnector.js');
		Ti.include('/kranium/lib/backbone/kranium-jquery.couch.js');
		
		var eventSplitter = /^(\w+)\s*(.*)$/;
		_.extend(Backbone.View.prototype, Backbone.Events, {
			tagName: 'view',
	
			make: function(tagName, attributes, content){
				Ti.API.log('making', [tagName, attributes, content]);
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

		global.BackboneView = View.extend({
			renderCollection: function(collection){
				var data = collection.map(function(model){
					return (model.el = K.creators[model.type](K.extend({ _modelId: model.id }, model.attributes)));
				});
				
				this.el.setData(data);
			},
			renderModel: function(model) {
				var el = model.el, key;

				var recreate = false,
					changed = model.changedAttributes();

				if(el){
					for(key in changed){
						if(typeof el[key] === 'undefined'){
							recreate = true;
						}
					}
					//K.log('renderModel', changed, el)
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
				

				this.collection && this.collection.sort();
				return this;
			},
			
			onAdd: function(model){
				this.renderModel(model).el.insertRowBefore(0, model.el);
			},
			
			// Titanium's row handling is BORKEN
			/*updateOrder: function(model){
				//K.log('updateOrder', model.get('order'));
				//K.log(this.collection.pluck('order'));
				var order = model.get('order'),
					$el = K('#' + model.get('id')),
					row = $el[0],
					rows = this.el.data[0].rows;
					
				K.log('rows', rows);	
				for(var i = 0, r; r = rows[i]; i++){
					K.log('comp', [r.order, order, r.order > order])
					if(r.order > order){
						break;
					}
				}
				i > 0 && i--;
				
				if(i == 0){
					K.log('insertbefore', 0);
					this.el.insertRowBefore(0, row);
				} else {
					K.log('insertafter', i);
					this.el.insertRowAfter(i, row);
				}
					
				K.log('going to', i);	
			},*/

			template: function(o){
				return K.extend({}, this._props, o, { type: this._klass });
			},

			init: function(){
				this.el = this._super.apply(this, arguments);
				this.model && this.model.bind('change', this.renderModel.bind(this));
				if(this.collection){
					this.renderCollection(this.collection);

					this.collection.bind('refresh', this.renderCollection.once(this));
					this.collection.bind('change', this.renderModel.bind(this));
					//this.collection.bind('change:order', this.updateOrder.bind(this));
					this.collection.bind('add', this.onAdd.bind(this));
					this.collection.bind('all', function(ev, model){
						//K.log(ev, model.attributes);
					});

				}
				return this.el;
			}

		});
	} catch (e){ Ti.API.error(e); }
})(this);

