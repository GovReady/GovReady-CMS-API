// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var merge = require('lodash/merge');
var url = require('url');
var tld = require('tldjs');
var async = require('async');

var helpers = require('../controllers/helpersController');
var monitor = require('../controllers/monitorController');





/** 
 * Check domain name expiration, ssl status
 */
exports.getDomainInfo = function(req, res) {

  if (!req.query.url) {
    return res.status(500).json( {err: 'Missing url querystring parameter'} );
  }

  var site = {
    url: req.query.url,
  }

  async.parallel([
    function(cb) {
      monitor.whois(site, cb);
    },
    function(cb) {
      monitor.ssl(site, cb);
    },
    function(cb) {
      monitor.wappalyzer(site, cb);
    }
  ], function(err, results){
    site = merge( merge(results[0], results[1]), results[2] );
    return res.status(200).json( site );
  }); // async

}
