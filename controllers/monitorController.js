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

var helpers = require('../controllers/helpersController');



// ssls: look into https://www.npmjs.com/package/ssl-utils#checkcertificateexpirationcert-callback
// domain whois: https://www.npmjs.com/package/node-whois https://www.npmjs.com/package/whois-ux

/* ping toolz
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
        return res.status(500).json( 'err: '+err );
      }
      return res.status(200).json( 'success: '+success );
    });
    
  });
}


/** 
 * Generic callback to trigger data collection from application (WP, Drupal, etc)
 */
exports.trigger = function(site, key, endpoint, cb) {
  var data = {
    url: site.url + '/wp-admin/admin-ajax.php?action=govready_v1_trigger',
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
      cb(null, body);
    }
    else {
      cb(error, null);
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
  exports.trigger(site, 'stack', 'stack/phpmyadmin', cb);
}


/** 
 * Ping site to check uptime status
 */
exports.ping = function(site, cb) {
  request(site.url, function (error, res, body) {
    // Website is up
    console.log(res);
    console.log(error);
    if (!error && res.statusCode === 200) {
      site.status.ping = {
        datetime: new Date().toISOString(),
        status: true
      }
      site.save();
      cb(null, res.statusCode);
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
      site.save();
      // @todo: send emails?
      cb(msg, null);
    }
  });
}


/** 
 * Check domain name expiration, ssl status
 */
 exports.domain = function(site, cb) {

  var parsed = url.parse('https://proudcity.com'); //@todo
  site.domain = null; //@todo tmp

  if (!site.domain || !site.domain.domain) {
    site.domain = {
      domain: parsed.hostname,
      ssl: {}
    };
  }

  // Get domain information
  whois.lookup(parsed.hostname, function(err, data) {
    var match = data.match( /Registrar Registration Expiration Date\:(.*)/ );
    var expires = match[1].trim();
    site.domain.expires = expires;
    site.domain.whois = data;


    // Get SSL information
    var req = https.request({
      host: parsed.hostname,
      method: 'get',
      path: '/'
    }, function (res) {
      site.domain.ssl.allowed = true;
      var cert = res.socket.getPeerCertificate();
      site.domain.ssl = {
        allowed: true,
        forced: true,
        expires: new Date(cert.valid_to).toISOString(),
        created: new Date(cert.valid_from).toISOString(),
        cert: cert
      };
      site.save();
    });
    
    req.on('error', function(err) {
      site.domain.ssl.allowed = false;
      site.save();
    });

    req.end();

    // Callback
    cb(null, true);

  });

}