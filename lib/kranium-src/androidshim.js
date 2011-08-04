if(K.is.android){
	var pad = function(num, totalChars) {
	    var pad = '0';
	    num = num + '';
	    while (num.length < totalChars) {
	        num = pad + num;
	    }
	    return num;
	};

	// Ratio is between 0 and 1
	var changeColor = function(color, ratio, darker) {
	    // Trim trailing/leading whitespace
	    color = color.replace(/^\s*|\s*$/, '');

	    // Expand three-digit hex
	    color = color.replace(
	        /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i,
	        '#$1$1$2$2$3$3'
	    );

	    // Calculate ratio
	    var difference = Math.round(ratio * 256) * (darker ? -1 : 1),
	        // Determine if input is RGB(A)
	        rgb = color.match(new RegExp('^rgba?\\(\\s*' +
	            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
	            '\\s*,\\s*' +
	            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
	            '\\s*,\\s*' +
	            '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
	            '(?:\\s*,\\s*' +
	            '(0|1|0?\\.\\d+))?' +
	            '\\s*\\)$'
	        , 'i')),
	        alpha = !!rgb && rgb[4] != null ? rgb[4] : null,

	        // Convert hex to decimal
	        decimal = !!rgb? [rgb[1], rgb[2], rgb[3]] : color.replace(
	            /^#?([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])/i,
	            function() {
	                return parseInt(arguments[1], 16) + ',' +
	                    parseInt(arguments[2], 16) + ',' +
	                    parseInt(arguments[3], 16);
	            }
	        ).split(/,/),
	        returnValue;

	    // Return RGB(A)
	    return !!rgb ?
	        'rgb' + (alpha !== null ? 'a' : '') + '(' +
	            Math[darker ? 'max' : 'min'](
	                parseInt(decimal[0], 10) + difference, darker ? 0 : 255
	            ) + ', ' +
	            Math[darker ? 'max' : 'min'](
	                parseInt(decimal[1], 10) + difference, darker ? 0 : 255
	            ) + ', ' +
	            Math[darker ? 'max' : 'min'](
	                parseInt(decimal[2], 10) + difference, darker ? 0 : 255
	            ) +
	            (alpha !== null ? ', ' + alpha : '') +
	            ')' :
	        // Return hex
	        [
	            '#',
	            pad(Math[darker ? 'max' : 'min'](
	                parseInt(decimal[0], 10) + difference, darker ? 0 : 255
	            ).toString(16), 2),
	            pad(Math[darker ? 'max' : 'min'](
	                parseInt(decimal[1], 10) + difference, darker ? 0 : 255
	            ).toString(16), 2),
	            pad(Math[darker ? 'max' : 'min'](
	                parseInt(decimal[2], 10) + difference, darker ? 0 : 255
	            ).toString(16), 2)
	        ].join('');
	};
	
	
	K['createTabbedBar'] = K.creators['tabbedbar'] = function(opts){
		var onClicks = [];
		if(opts.click){
			onClicks.push(opts.click);
			delete opts.click;
		}
		
		var	labelWidth = (opts.width||320)/opts.labels.length,
			backgroundColor = opts.backgroundColor || K.getStyle(null, 'tabbedbar').backgroundColor || '#ccc',
			selectedBackgroundColor = changeColor(backgroundColor, 0.2, true),
			labels = (opts.labels||[]).map(function(o, i){
				if(typeof o === 'string'){
					o = { type: 'label', text: o };
				}
				o.className = (o.className||'') + ' tabbedBarLabel';
				
				return K.create(K.extend({
					width: labelWidth,
					left: labelWidth*i,
					backgroundColor: i === opts.index ? selectedBackgroundColor : backgroundColor,
					click: function(){
						if(bar.index === i){ return; }
						labels[bar.index].backgroundColor = backgroundColor;
						labels[i].backgroundColor = selectedBackgroundColor;
						bar.index = i;
						
						onClicks.forEach(function(callback){
							callback({
								index: i,
								source: bar
							});
						});
					}
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
			height: 44,
			children: labels.concat(separators)
		}, opts));
		return bar;
	};
	
	
	Window = Window.extend({
		init: function(o){
			if(this.leftNavButton || this.rightNavButton){
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
					},
					{
						type: 'tabbedbar',
						bottom: 0,
						index: 1,
						width: 320,
						labels: ['skorv', 'torv'],
						click: function(e){
							K.log(' ======================== e', e);
						}
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
		},
	});

}