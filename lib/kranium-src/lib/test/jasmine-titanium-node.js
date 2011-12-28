(function() {
    
    if (!jasmine) {
        throw new Exception("jasmine library does not exist in global namespace!");
    }
    
    /*!
 	* TitaniumReporterNode
	* Copyright (c) 2011 Jacob Waller <jacob@krawaller.se>
	* Based on TitaniumReporter, copyright (c) 2011 Guilherme Chapiewski
	* MIT Licensed
	*
	* jasmine.getEnv().addReporter(new jasmine.TitaniumReporter());
	* jasmine.getEnv().execute();
	*/
	var TitaniumNodeReporter = function() {
		this.failedCount = 0;
		this.successCount = 0;
		this.failures = [];
    };

	var sys = {
		puts: function(msg){ socketwrite(msg, 'puts'); },
		print: function(msg){ socketwrite(msg, 'print'); },
	};

	ansiColor = function(color) {
	  var colors = {
	    green: "32",
	    red: "31",
	    yellow: "33"
	  };

	  if (color) {
	    sys.print("\033[" + colors[color] + "m")
	  } else {
	    sys.print("\033[0m")
	  }
	};

    TitaniumNodeReporter.prototype = {
        reportRunnerResults: function(runner) {
			sys.puts("\n")
			for (var i = 0; i < this.failures.length; i++) {
				var failure = this.failures[i];
				sys.puts("Failing test in '" + failure.getFullName() + "'")
				var items = failure.results().getItems();
				for (var j = 0; j < items.length; j++) {
					var item = items[j];
					if (item.passed()) continue;

					sys.puts(item.trace.message);
				}
				sys.puts("")
			}
			var endTime = (new Date()).getTime();

			customsocketwrite({
				action: 'notify',
				title: (runner.topLevelSuites()||[{ description: 'bah' }])[0].description,
				msg: 'Passed ' + this.successCount + "/" + (this.failedCount + this.successCount)
			});
			 			
			sys.puts("Tests finished in " + (endTime - this.startTime) + "ms. " + this.successCount + " success, " + this.failedCount + " failed.");
		},


        reportRunnerStarting: function(runner) {
			this.startTime = (new Date()).getTime();
			sys.print('\x1b[1J\x1b[H');
            sys.puts("Starting tests...");
        },

        reportSpecResults: function(spec) {
			var result = spec.results();
			  if (result.passed()) {
			    this.successCount++;
			    ansiColor("green");
			    sys.print(".");
			  } else if (result.skipped) {
			    ansiColor("yellow");
			    sys.print("*");
			  } else {
			    ansiColor("red");
			    this.failedCount++;
			    this.failures.push(spec);
			    sys.print("F");
			  }
			  ansiColor(null);
        },

        reportSpecStarting: function(spec) {
            //this.log('[' + spec.suite.description + '] ' + spec.description + '... ');
        },

        reportSuiteResults: function(suite) {
            /*var results = suite.results();
			var xhr = Ti.Network.createHTTPClient();
			xhr.open("GET", 'http://localhost:9000/?m=' + encodeURIComponent('Passed ' + results.passedCount + '/' + results.totalCount) + '&t=' + encodeURIComponent(suite.description||""));
			xhr.send();*/
            //this.log('<b>[' + suite.description + '] ' + results.passedCount + ' of ' + results.totalCount + ' assertions passed.</b><br><br>');
        },

        log: function(str) {
            //this.updateTestResults(str);
        }
    };
    
    // export public
    jasmine.TitaniumNodeReporter = TitaniumNodeReporter;
})();