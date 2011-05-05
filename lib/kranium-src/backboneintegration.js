(function(global){
	try {
		global.Backbone = Backbone = require('backbone-adapted').Backbone;
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
	
		Ti.include('/jquery.couch.js');
		Ti.include('/backbone-couchconnector.js');

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

				this.collection && this.collection.sort();
				return this;
			},

			template: function(o){
				return K.extend({}, this._props, o, { type: this._klass });
			},

			init: function(){
				this.el = this._super.apply(this, arguments);
				this.model && this.model.bind('change', this.renderModel.bind(this));
				if(this.collection){
					this.renderCollection(this.collection);

					this.collection.bind('refresh', this.renderCollection.bind(this));
					this.collection.bind('change', this.renderModel.bind(this));

					this.collection.bind('all', function(ev, model){
						Ti.API.log(ev, JSON.stringify(model));
					});

				}
				return this.el;
			}

		});
	} catch (e){ Ti.API.error(e); }
})(this);

