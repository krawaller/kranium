#!/usr/bin/env node

var options = require('nomnom').opts({
  command: {
    position: 0,
    help: "either 'test', 'run', or 'xpi'" 
  },
  config: {
    string: '-c FILE, --config=FILE',
    help: 'json file with tests to run',
  },
  debug: {
    string: '-d, --debug',
    help: 'use debug mode'
  }
}).parseArgs();