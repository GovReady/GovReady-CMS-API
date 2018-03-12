// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var url = require('url');
var whois = require('whois');
var https = require('https');
var tld = require('tldjs');
var wappalyzer = require('wappalyzer');
var async = require('async');

var helpers = require('../controllers/helpersController');



// ssls: look into https://www.npmjs.com/package/ssl-utils#checkcertificateexpirationcert-callback
// domain whois: https://www.npmjs.com/package/node-whois https://www.npmjs.com/package/whois-ux

/* ping tools
https://github.com/alfredwesterveld/freakinping
http://blog.ragingflame.co.za/2013/2/14/roll-out-your-own-uptime-monitor-with-nodejs
https://github.com/fzaninotto/uptime/blob/master/lib/monitor.js
https://www.npmjs.com/package/ping-monitor

https://www.npmjs.com/package/rsmq

https://devcenter.heroku.com/articles/asynchronous-web-worker-model-using-rabbitmq-in-node
*/

  

var monitors = {
  "ping": {
    "frequency": 300 // 5m
  },
  "domain": {
    "frequency": 604800 // 1wk
  },
  "plugins": {
    "frequency": 86400 // 1d
  },
  "accounts": {
    "frequency": 86400 // 1d
  },
  "stack": {
    "frequency": 604800 // 1wk
  }
};


/** 
 * Create a new RabbitMQ task
 */
exports.createTask = function(data, delay) {
  delay = delay = undefined ? 0 : delay;
  data = JSON.stringify(data);
  rsmq.sendMessage({qname: process.env.RABBITMQ_QUEUE, message: data, delay: delay}, function (err, resp) {
    if (resp) {
      console.log("RSMQ: Message sent. ID:", resp);
    }
  });
}


/** 
 * Create all tasks for a site
 */
exports.createSiteTasks = function(site) {
  monitors.forEach(function(meta, key) {
    createTask( {
      siteId: site._id,
      callback: key
    }, monitors[key].frequency / 8640 );
  }); // foreach
}


/** 
 * Runs a task from the message queue.
 * Called from ./monitor.js.
 */
exports.processTask = function(data) {
  Site.findOne( { _id: data.siteId } )
  .then(function (site) {

    exports[data.callback](site, function(err, success) {
      if (err) {
        // @todo
        console.log('MONITOR: failed task');
      }

      // Mark task last run time
      site.status[data.callback] = new Date();

      // Re-queue the same task
      helpers.newTask( data, monitors[data.callback] );
    });
    
  });
}


/** 
 * Page callback to manually trigger monitor
 */
exports.getMonitor = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    exports[req.params.callback](site, function(err, success) {
      if (err) {
        return res.status(500).json( {'err': err} );
      }
      return res.status(200).json( {'success': success} );
    });
    
  });
}


/** 
 * Generic callback to trigger data collection from application (WP, Drupal, etc)
 */
exports.trigger = function(site, key, endpoint, cb) {
  if (site == null) {
    return res.status(500).json( {'err': 'Site not found'} );
  }
  site.application = helpers.siteApplication(site);
  switch ( site.application ) {
    case 'wordpress':
      var url = site.url + '/wp-admin/admin-ajax.php?action=govready_v1_trigger';
      break;
    case 'drupal':
      var url = site.url + '/govready/trigger';
      break;
  }
  console.log(url);
  var data = {
    url: url,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    form: {
      key: key,
      endpoint: endpoint,
      siteId: site._id.toString()
    }
  };
  console.log('CALLING SITE TRIGGER: ', data);
  request(data, function (error, res, body) {
    if (!error && res.statusCode === 200) {
      console.log(body);
      site.status[key] = {
        datetime: new Date().toISOString(),
        status: true
      }
      site.save(function() {
        cb(null, body);
      });
    }
    else {
      console.log('ERROR IN SITE TRIGGER CALLBACK: status: '+res.statusCode, error, body);
      site.status[key] = {
        datetime: new Date().toISOString(),
        status: false,
        message: error
      }
      site.save(function() {
        cb(error, null);
      });
    }
  });
}

/** 
 * Wrapper to collect plugin data
 */
exports.plugins = function(site, cb) {
  exports.trigger(site, 'plugins', 'plugins', cb);
}

/** 
 * Wrapper to collect account data
 */
exports.accounts = function(site, cb) {
  exports.trigger(site, 'accounts', 'accounts', cb);
}

/** 
 * Wrapper to collect stack data
 */
exports.stack = function(site, cb) {
  exports.trigger(site, 'stack', 'stack', cb);
}


/** 
 * Ping site to check uptime status
 */
exports.ping = function(site, cb) {
  request({
    url: site.url,
    timeout: 500,
   }, function (error, res, body) {
    // Website is up
    //console.log(res);
    //console.log(error);

    if (typeof site.status === 'object' && !error && res.statusCode === 200) {
      site.status.ping = {
        datetime: new Date().toISOString(),
        status: true
      }
      site.save(function() {
        cb(null, res.statusCode);
      });

    }
    // No error but website not ok
    //else if (!error) {}
    // Loading error
    else {
      var msg = error ? 'error' : 'unknown';
      site.status.ping = {
        datetime: new Date().toISOString(),
        status: false,
        message: msg
      }
      site.save(function() {
        // @todo: send emails?
        cb(msg, null);
      });
    }
  });
}


/** 
 * Check domain name expiration, ssl status
 */
exports.domain = function(site, parentCallback) {

  async.parallel([
    function(cb) {
      exports.whois(site, cb);
    },
    function(cb) {
      exports.ssl(site, cb);
    },
    function(cb) {
      exports.wappalyzer(site, cb);
    }
  ], function(error, results){
    if (!error) {
      site = merge(merge(results[0], results[1]), results[2]);
      site.status.domain = {
        datetime: new Date().toISOString(),
        status: true
      }
    } else {
      site.status.domain = {
        datetime: new Date().toISOString(),
        status: false,
        message: error
      }
    }
    site.save(function() {
      parentCallback(err, site);
    });
  }); // async

}


/** 
 * Check domain name expiration, ssl status
 */
exports.ssl = function(site, cb) {
  var parsed = url.parse(site.url);
  var req = https.request({
    host: parsed.hostname,
    method: 'get',
    path: '/'
  }, function (res) {
    site.domain.ssl.allowed = true;
    var cert = res.socket.getPeerCertificate();
    cert.raw = undefined;
    site.domain.ssl = {
      allowed: true,
      forced: false,
      //expires: new Date(cert.valid_to).toISOString(),
      //created: new Date(cert.valid_from).toISOString(),
      cert: cert
    };

    // See if SSL is forced
    request.get('http://' + parsed.hostname, function (err, res, body) {
      if (res.request.uri.protocol == 'https:') {
        site.domain.ssl.forced = true;
      }
      return cb(null, site);
    });
    
  });
  req.end();
  
  req.on('error', function(err) {
    console.log('err');
    site.domain.ssl = { allowed: false };
    site.status.ssl = {
      datetime: new Date().toISOString(),
      status: false,
      message: err
    }
    return cb(null, site);
  });

  req.on('socket', function (socket) {
    socket.setTimeout(1000);  
    socket.on('timeout', function() {
      console.log('timeout);10');
      site.domain.ssl = { allowed: false };
      site.status.domain = {
        datetime: new Date().toISOString(),
        status: true
      }
      return cb(null, site);
    });
  });

}


/** 
 * Check domain name expiration, ssl status
 */
exports.whois = function(site, cb) {

  var parsed = url.parse(site.url);
  var domain = tld.getDomain(site.url);
  site.domain = {
    domain: domain,
    hostname: parsed.hostname,
    ssl: {  }
  };

  whois.lookup(domain, function(err, data) {
    if (data) {
      site.domain.whois = data;

      var match = data.match( /(Registrar Registration Expiration Date|Registry Expiry Date|Expiration Date)\:(.*)/ );
      if (match && match[2]) {
        var expires = match[2].trim();
        site.domain.expires = expires;
      } else {
        console.log('COULD NOT REGEX DOMAIN EXPIRATION DATE', data);
      }
      site.status.whois = {
        datetime: new Date().toISOString(),
        status: true
      }
      // @TODO should this be saving??
      site.save(function() {
        return cb(null, site);
      });
    } else {
      site.status.whois = {
        datetime: new Date().toISOString(),
        status: false,
        message: err
      }
      site.save(function() {
        console.log('WHOIS ERR', err);
        cb(err, null);
      });
    }
  });

}


/** 
 * Check domain name expiration, ssl status
 */
 exports.wappalyzer = function(site, cb) {

  var parsed = url.parse(site.url);
  var options={
    url: site.url,
    hostname: parsed.hostname,
    debug: false
  }

  wappalyzer.detectFromUrl( options, function(err, apps, appInfo) {
    if (appInfo) {
      site.wappalyzer = appInfo;
    }
    cb(err, site);
  });

}
