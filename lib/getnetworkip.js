module.exports = (function () {
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

    var cached;
    var os=require('os');    

    if(os.networkInterfaces || os.getNetworkInterfaces){
        //getNetworkInterfaces for node v0.5.x deprecated in v0.6.x
        var networks = os.networkInterfaces? os.networkInterfaces() : os.getNetworkInterfaces();

        return function (callback, bypassCache){
             // get cached value
            if (cached && !bypassCache) {
                callback(null, cached);
                return;
            }

            var ifaces=os.networkInterfaces();
            var ips = [];
            for (var dev in ifaces) {
              ifaces[dev].forEach(function(details){
                if (details.family=='IPv4') {
                    ips.push(details.address);
                }
              });
            }

             // filter BS
            for (var i = 0, l = ips.length; i < l; i++) {
                if (!ignoreRE.test(ips[i])) {
                     cached = ips[i];
                    callback(null, ips[i]);
                    return;
                }
            }
            // nothing found
            callback(error, null);
        };
    }else{
        //Deprecated, only for supporting node v0.4.x
        var exec = require('child_process').exec;
        var command;
        var filterRE;

        switch (process.platform) {
        // TODO: implement for OSs without ifconfig command
        case 'darwin':
             command = 'ifconfig';
             filterRE = /\binet\s+([^\s]+)/g;
             // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
             break;
        default:
             command = 'ifconfig';
             filterRE = /\binet:\s*([^\s]+)/g;
             // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
             break;
        }

        return function (callback, bypassCache) {
             // get cached value
            if (cached && !bypassCache) {
                callback(null, cached);
                return;
            }

            
            // system call
            exec(command, function (error, stdout, sterr) {
                var ips = [];
                // extract IPs
                var matches = stdout.match(filterRE);
                // JS has no lookbehind REs, so we need a trick
                for (var i = 0; i < matches.length; i++) {
                    ips.push(matches[i].replace(filterRE, '$1'));
                }

                // filter BS
                for (var i = 0, l = ips.length; i < l; i++) {
                    if (!ignoreRE.test(ips[i])) {
                        //if (!error) {
                            cached = ips[i];
                        //}
                        callback(error, ips[i]);
                        return;
                    }
                }
                // nothing found
                callback(error, null);
            });
        };
    }
})();