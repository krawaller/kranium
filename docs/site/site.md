#Kranium

__Kranium has enough brains to let your brain focus on the crucial stuff while developing Titanium Mobile apps.__ Kranium transfers some well known practices and techniques from web development to Titanium Mobile development. It's both spiritually and physically the lovechild of the following great web tech:

* [jQuery](http://www.jquery.com) / [Zepto](http://zeptojs.com)
* [Backbone](http://documentcloud.github.com/backbone/)
* [Jade](http://www.jade-lang.com)
* [Livetanium](http://blog.krawaller.se/livetanium) / [Livereload](http://livereload.com/)
* [Sizzle](http://sizzlejs.com/) / [mini.js](https://github.com/jamespadolsey/mini)
* [Jasmine](http://pivotal.github.com/jasmine/)
* [JSS](http://wiki.appcelerator.org/display/guides/Designing+the+User+Interface#DesigningtheUserInterface-CrossplatformlayoutusingJSS) / [Stylus](http://learnboost.github.com/stylus/) / [Sass](http://sass-lang.com/) / [LESS](http://lesscss.org/)
* [JSConsole](http://jsconsole.com/) / [Weinre](http://phonegap.github.com/weinre/)

Kranium tries to abstract the hell out of everything painful in the standard Titanium API:s. Kranium believes these main pains to be __UI creation__, __low-level API:s__, __styling__ and __code structuring__. Kranium helps you with your __KISS__:ing and keeps you __DRY__. 

Kranium isn't super tiny. The core library currently weighs in at 31 kb uglified. It also lazy loads other libraries when needed. For example a variant of Jade is bundled containing a compiler outputting Kranium-friendly templates. This file 19 kb uglified, but only loaded if needed.

Our very first priority is to simplify Titanium Mobile development, and doing so without sacrificing perceived performance. If you find a case where this is not the case, do [tell us](mailto://kranium@krawaller.se). 


__Latest version:__ [0.1.0](kranium.js) ([minified](kranium.min.js)).
Or check out the [source code](http://github.com/krawaller/kranium).

#Overview

So, what does Kranium give you?

* Simple UI creation
* Extendable UI modules 
* Live updating of UI modules
* Jade templates
* CSS-like stylesheets
* Live updating of styles
* Live compiling of Stylus/SASS/Less
* Simple selector engine
* jQuery-like manipulation library
* jQuery-like Ajax API
* Realtime Jasmine testing
* Beautiful two-way console
* Peace in your heart

But don't take my word for it. Take a look at the source of the example applications below, and decide for yourself. 

 
#Installation

Installing Kranium is very straightforward if you have NodeJS and its package manager NPM installed. If you do, install the Kranium command line tool by running `npm install kranium -g` in your terminal.

If you don't, you'll first have to install NodeJS and NPM using any of the installation instructions found [here](http://example.com) before following the previous paragraph.


#Using Kranium

When you've installed it as above, you're good to go. Open your terminal and `cd` somewhere into your Titanium project folder and run `kranium init`. This will make Kranium setup the folder structure in your project, copy all dependencies and even inject a `Ti.include`-clause into app.js.

![Kranium folder structure](site/images/folderstructure.png)

So what's what here? Let's walk through the generated folders from the top:

* __jade__ is a folder containing your jade templates (surprise!). These can be pulled in and rendered using for example `J(filename, { options: "here" }).appendTo("window")`.

* __kranium__ contains the actual Kranium libraries and the bootstrapper. Most often you don't have to touch anything here.

* __kss__ hosts your CSS-like stylesheets. Any `stylus`, `SASS` or `Less` files will be automatically compiled to `kss` if you have `kranium init` or `kranium watch` running in the terminal. The styles in `app.kss` will be autoloaded when the app starts and affects the global styling. Any other `kss` files will be autoloaded and applied to modules with the same name.

* __kui__ is the home of all your fancy Kranium UI modules. These can extend the basic types `window`, `label`, `view` etc. or any of your own modules. Styles are pulled in from the __kss__ folder and applied accordingly.

* __test__ hosts all your Jasmine unit tests. If you run `kranium init --test` from the terminal, the tests will run when the app starts and the results will be reported to the terminal. If wanted, tests can also be automatically re-run whenever a test definition or source file changes. 
    
#Simple UI creation
As we mentioned in the overview, one of Kranium's main goals is to simplify everyday Titanium Mobile life by easing your UI creation burden. Lets first have a look at a classic tabgroup using vanilla Titanium Mobile API:s.

##Example

	// Vanilla Titanium Mobile 
	var tabGroup = Ti.UI.createTabGroup(),

	    win1 = Ti.UI.createWindow({
	        backgroundColor: '#ccc',
	        barColor: '#00a',
	        title: 'My window'
	    }),
    
	    tab1 = Ti.UI.createTab({
	        icon: 'path/to/my/icon',
	        title: 'My tab',
	        window: win1
	    }),
    
	label1 = Ti.UI.createLabel({
	    text: 'Hello world!',
	    textAlign: 'center',
	    color: '#333',
	    shadowColor: '#fff',
	    shadowOffset: { 
	        y: -1, 
	        x: 0
	    },
	    font: {
	        fontSize: 20,
	        fontWeight: 'bold'
	    }
	});

	win1.add(label1);
	label1.addEventListener('click', function(e){
	    alert('You clicked me!');
	});

	tabGroup.addTab(tab1);
	tabGroup.open();

That was kinda verbose, don't you think? And you don't see the resulting UI structure straight away since you have to keep references to stuff and manually adding them to the correct parent. The same use case when using Kranium looks like this:

	// Kranium
	K({
	    type: 'tabgroup',
	    tabs: [{
	        cls: 'myTab',
	        window: {
	            cls: 'myWindow',
	            children: [{
	                text: 'Hello world!',
	                cls: 'mylabel',
	                click: function(){
	                    alert('You clicked me!');
	                }
	            }]
	        }
	    }]
	}).open();

It's easy to visualize the resulting structure, and events can be defined on elements upon creation. But aren't we cheating here - where is all the styling? Kranium practices separation of concerns, so the styles are meant to be loaded from the `kss` folder. Therefore our `app.kss` should look like follows to correspond to the previous example:

	.myTab { 
	    icon: path/to/my/icon; 
	}
	window {
	    background-color: #ccc;
	    bar-color: #00a;
	}
	.myLabel {
	    text-align: center;
	    color: #333;
	    shadow-color: #fff;
	    shadow-offset-y: -1;
	    font-size: 20;
	    font-weight: bold;
	}

##Usage

Kranium provides enhanced versions of the same UI Element factory functions found in the plain Titanium Mobile API:s. These are accessible directly from the `K` object like so:

    K.createLabel({ text: "Hello world! "});

So how does this function differ from `Ti.UI.createLabel`?. It is enhanced in two ways:

* Styles are applied.
* Children and other special properties are turned into real Ti Objects

The second point means that you can do the following...

    K.createView({
	    children: [{
		    type: "image",
		    image: "path/to/image",
		    click: function(){ K.alert("You clicked the image!"); }
	    },
	    {
		    type: "label",
		    "text": "howdy?"
	    }]
    });

...and the `children` array will be automatically turned into an array of Ti Objects and added to the parent view.

There is also a general purpose function called `K.create` which works pretty much the same way. It can take either a single javascript `object` with a `type` property or an `array` of the same, and turns them into instantiated Ti Objects. However, there is something very special with `K.create`, detailed below. 

#Extendable UI modules

If `K.create` comes across a `type` which is not a standard Titanium Mobile UI type, it will look in your `kui` folder and try to autoload the module from a file with the same name. Huh?! Example time!

##Example

	K.create({
		type: "loginstatus"
	});
	
This will make Kranium look for the file `kui/loginstatus.js` and try to require it and create an instance of it. The code in the file would look something like:

	exports.Class = Label.extend({
		init: function(opts){
			this.events = {
				app: {
					authchange: this.updateStatus.bind(this)
				}
			};
			
			this.updateStatus();
			this._super.call(this, opts);
		},
		
		updateStatus: function(e){
			this.text = "Logged " + (e && e.loggedIn ? "in" : "out");
		}
	});
	
Here we extend the basic type `Label` and gives it some special abilities. The `init` function runs upon initialization. It binds an app-wide event, updates the label and calls the `this._super` function which creates the actual element. Now we can create any number of instances of this module, and they will all update whenever the `authchange` event fires. This module could then be extended again if you'd like.

##API

...


#Live updating UI modules

Kranium builds upon our previous work on [Livetanium](http://blog.krawaller.se/livetanium). This means that you'll see your changes in the __simulator__ or on the __device__ as sone as you save a `kss`-file (iOS only at the moment). This is a true painkiller for your styling needs. This only works if you have `kranium init` or `kranium watch` running in your terminal. This will start a script watching for changes of your project files. So whenever something changes, it will be piped to the app over a socket in realtime, and applied to all relevant elements.

As if just live updating of your style changes weren't enough, we have experimental support for live updating of the UI modules themselves. So if we were to change the `updateStatus` function in the module definition in `kui/loginstatus.js` above to:

	updateStatus: function(e){
		this.text = "Thou are logged " + (e && e.loggedIn ? "in" : "out");
	}

all instances of the module would be updated with this new behaviour. __Caveat__ behind the scenes a new instance of the updated module is created with the same options as its predecessor and the new instance then takes its place in the view hierarchy. This might, quite frankly, fuck things up, so if you don't want to risk anything you can turn it off.

#Jade templates

Kranium lets you use [Jade](http://www.jade-lang.com) to create elements. You can do this through the function

	K.jade(jadeString || jadeFilename, [opts])

As you see, this function can either take a plain string of Jade goodness, or a filename (ending in .jade) which will then be pulled in from the `jade` folder and executed. The second parameter is the options object which will be used to populate the data in the Jade template. There is also an equivalent of the `K` function which takes Jade strings or filenames, and it is of course called `J`. 

	J(jadeString || filename, { options: "here" }).appendTo("window");

This is actually only a shortcut for `K(K.jade(jadeString, opts))` but quite convenient nonetheless.

However, the Jade integration is deeper than that. If `K.create` comes across a plain string where it normally expects a `Ti Object` or a `{ type: ... }` declaration, it will treat it as a Jade template and try to instantiate it. In practice, this means you can do the following:

	K.create("label.myLabel hello!");
	
	K.createView({
		children: [
			"image.myImage",
			"label Cool!"
		]
	});

#CSS-like stylesheets

When Appcelerator announced JSS support, we were truly stoked. However, we soon found out that the implementation was somewhat lacking in speed, stability and power. Instead of just braking down and cry, we decided to roll our own stylesheet engine. This is the reason we can do live style updates, and also the reason we can make it so damn pleasant to use.

You place your stylesheets in the `kss` folder. The `app.kss` file is the global stylesheet which is autoloaded when the app starts. Whenever you load a custom module for the first time, Kranium looks for a stylesheet with a corresponding name in the `kss` folder.

#Live compiling
The command line tool also compiles `CoffeeScript`, `Stylus`, `SASS` and `Less` on the fly. This means you can use these techniques seamlessly. For now, this means your source and style folders will contain both the original and the compiled files. We might want to refactor this behaviour to output the generated files into another folder. Maybe you can help us with a pull request?!

#Simple selector engine

Kranium also bundles a variant of James Padolsey's excellent mini.js selector engine. It's not as powerful as `Sizzle` or `document.querySelectorAll`, but it hopefully fulfills your basic needs. It supports the following selectors (and variations):

* view
* .example
* view label
* view, label
* view, label, .example
* view > label
* view.example
* view .example
* #title
* label#title
* view #title

If you only want the selector engine, it's available through `$$(selector, context)`:

	$$("label")[0].text = "nice!";
	
But stay tuned, because the real beauty comes in the next section.

#jQuery-like manipulation library

Kranium tries to take the immense success and simplicity of jQuery and apply it to Titanium Mobile development. The following is not only valid jQuery, but also valid Kranium.

	$('.content > .label, .hello').text('hello!');

Kranium's manipulation library is a port of the beautiful Zepto library, and tries to give the user the beauty of jQuery without the hefty weight. This functionality is available through the `K` function and also aliased to `$`. It gives you access to powerful collections with lots of utility functions. These are pretty much the same as Zeptos:

	get(): return array of all elements found
	get(0): return first element found
	size(): the number of elements in collection
	each(callback): iterate over collection, calling callback for every element
	index('selector'): the position of element matching 'selector' in the current collection
	first(): new collection containing only the first matched element
	last(): new collection containing only the last matched element
	add(): merges collections of elements

	find('selector'): find all children/grandchildren that match the given selector
	closest('selector'): find the first matching element by going upwards starting from the current element
	parents(['selector']): get all ancestors of elements in collection, optionally filtered by a selector
	parent(): immediate parent node of each element in collection
	children('selector'): immediate children of each element in collection, optionally filtered by a selector
	siblings('selector'): elements that share the same immediate parent (siblings) of each element in collection, optionally filtered by a selector
	next(): next siblings
	prev(): previous siblings
	filter('selector'): reduce the current set of elements to match the given selector
	is('selector'): returns true/false if first element matches the selector
	not('selector'): remove elements matching 'selector' from the current collection
	not(function(index){return true / false;}): remove elements from current collection if the callback method returns `true`

	remove(): remove element

	text(): get first element's .text||.title
	text('new text'): set the text contents of the element(s)
	append(), prepend(): like html(), but add html (or a DOM Element or a Zepto object) to element contents
	appendTo(), prependTo(): reverse appending/prepending
	show(): forces elements to be displayed
	hide(): removes a elements from layout

	height(): get first elements height in px
	width(): get first elements width in px

	attr('attribute'): get element attribute
	attr('attribute', 'value'): set element attribute
	removeAttr('attribute'): removes an attribute

	css('css property', 'value'): set a CSS property
	css({ property1: value1, property2: value2 }): set multiple CSS properties
	css('css property'): get this CSS property of the first element

	addClass('classname'): adds a CSS class name
	removeClass('classname'): removes a CSS class name
	hasClass('classname'): returns true of first element has a classname set
	toggleClass('classname'[, switch]): adds/removes class, or adds/removes it when switch == true/false

	bind(type, function): add an event listener (see below)
	one(type, function): add an event listener that only fires once
	unbind([type [, function]]): remove event listeners
	die([, type[, function]]): remove live listener
	trigger(type): triggers an event

	val(): returns the value of the form element
	val('value'): sets the value of the form element


#jQuery-like Ajax API

	$.ajax({
		type: 'POST', // defaults to 'GET'
		url: '/foo', // no default
		data: {name: 'Zepto'}, // can be a string or object (objects are automatically serialized to JSON)
		dataType: 'json', // what response type you accept from the server ('json', 'xml', 'html', or 'text')
		success: function(body) { ... }, // body is a string (or if dataType is 'json', a parsed JSON object)
		error: function(xhr, type) { ... } // type is a string ('error' for HTTP errors, 'parsererror' for invalid JSON)
	})

#Realtime Jasmine testing

Kranium also plays nice with the [Jasmine BDD framework](http://pivotal.github.com/jasmine/). If you run

	kranium init --test

from the terminal, the tests in your `test` folder will run when the app starts and the results will be reported to the terminal. If wanted, tests can also be automatically re-run whenever a test definition or source file changes.

![Kranium folder structure](site/images/jasmine.png)

#Beautiful two-way console

Kranium integrates [Remy Sharp](http://remysharp.com/)'s excellent JSConsole. This is a simple REPL which lets you do some quick testing. It can be found at http://localhost:3333 if you have the `kranium` tool running in your terminal.

![Kranium folder structure](site/images/console.png)


#FAQ

* *Uhm... what questions are frequently asked?*
  We don't know yet. Please let us know! :-)
  
* *Do you like raptors?*
  No, we quite like being alive.

#Change Log

__0.1.0:__ 2011-08-01 - first public release  

<script type="text/javascript" charset="utf-8">
  jQuery(function($){
    function dasherize(str) {
      return str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
                .replace(/([a-z\d])([A-Z])/g, '$1-$2')
                .replace(/\s/g, '-')
                .toLowerCase();
    }

    var sidebar = $("<div />").attr("id", "sidebar");
    
    $("h1").each(function(){
      var name = $(this).text();
      $(this).attr("id", "h-" + dasherize(name));

      sidebar.append(
        $("<a />").attr("href", "#" + $(this).attr("id")).text(name)
      )

      var subs = $(this).nextUntil("h1").filter("h2");

      if( subs.length > 0 ) {
        var list = $("<ul />");
        subs.each(function(){
          var subName = $(this).text();
          $(this).attr("id", "s-" + dasherize(name) + '-' + dasherize(subName));

          list.append(
            $("<li />").append(
              $("<a />").text(subName).attr("href", "#" + $(this).attr("id"))
            )
          )
        });
        
        sidebar.append(list);
      }
    });
    
    $("body").prepend(sidebar);
  });
</script>