// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');

var helpers = require('../controllers/helpersController');


/// @todo: look at https://github.com/fzaninotto/uptime/blob/master/lib/monitor.js

// ssls: look into https://www.npmjs.com/package/ssl-utils#checkcertificateexpirationcert-callback
// domain whois: https://www.npmjs.com/package/node-whois https://www.npmjs.com/package/whois-ux


/** 
 * Monitor constructor
 */
function Monitor (opts) {
  // holds website to be monitored
  this.website = '';
  // ping intervals in minutes
  this.timeout = 15;
  // interval handler
  this.handle = null;
  // initialize the app
  this.init(opts)
}

/** 
 * Monitor methods
 */
Monitor.prototype = {
  init: function (opts) {
    var self = this;
    self.website = opts.website;
    self.timeout = (opts.timeout * (60 * 1000));
    // start monitoring
    self.start();
  },
}

module.exports = Monitor;


/** 
 * Endpoint /sites/:siteID for GET
 */
exports.getSite = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/collect for POST
 */
exports.postSiteCollect = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/accounts for POST
 */
exports.postSiteAccounts = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    site.accounts = req.body.accounts;
    site.save();
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/plugins for POST
 */
exports.postSitePlugins = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    site.plugins = req.body.plugins;
    site.save();
    return res.status(200).json(site);  
  });

} // function



/** 
 * Endpoint /sites/:siteId/collect for POST
 */
exports.postSiteStackPhpinfo = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    var phpinfo = req.body.phpinfo;
    site.stack = {
      'os': phpinfo['uname'],
      'server': phpinfo['PHP Variables']['_SERVER["SERVER_SOFTWARE"]'],
      'database': null,
      'application': phpinfo['application'],
      'language': phpinfo['php'],
      'info': phpinfo,      
    }

    if ( phpinfo.mysql != undefined ) {
      site.stack.database = 'Mysql ' + phpinfo.mysql['Client API version'];
    }
    // @todo: mariadb...

    site.save();

    return res.status(200).json(site);
  });

} // function

/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

