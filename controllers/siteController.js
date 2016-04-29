// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');

var helpers = require('../controllers/helpersController');

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
    console.log('Accounts', site.accounts);
    site.save();
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/accounts for GET
 */
exports.getSiteAccounts = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    if (!site.accounts) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.accounts);
  });

} // function


/** 
 * Endpoint /sites/:siteId/plugins for POST
 */
exports.postSitePlugins = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    site.plugins = req.body.plugins;
    console.log('Plugins', site.plugins);
    site.save();
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/accounts for GET
 */
exports.getSitePlugins = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    if (!site.accounts) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.plugins);
  });

} // function



/** 
 * Endpoint /sites/:siteId/stack for POST
 */
exports.postSiteStack = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    // @todo
    //if ( phpinfo.mysql != undefined ) {
    //  site.stack.database = 'Mysql ' + phpinfo.mysql['Client API version'];
    //}
    // @todo: mariadb...
  
    console.log('Stack', req.body.stack);
    site.save();

    return res.status(200).json(site);
  });

} // function


/** 
 * Endpoint /sites/:siteId/stack for GET
 */
exports.getSiteStack = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    console.log(site);
    if (!site.stack) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.stack);
  });

} // function


/** 
 * Endpoint /sites/:siteId/domain for GET
 */
exports.getSiteDomain = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    if (!site.domain) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.domain);
  });

} // function


/** 
 * Endpoint /sites/:siteId/status for GET
 */
exports.getSiteStatus = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    if (!site.status) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.status);
  });

} // function


/** 
 * Endpoint /sites/:siteId/recommended for GET
 */
exports.getSiteRecommended = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    try {
      var doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../data/wordpress-recommend.yml', 'utf8'));
      console.log(doc);
      return res.status(200).json(doc);
    } catch (e) {
      return res.status(500).json();
    }
  });

} // function


/** 
 * Endpoint /sites/:siteId/security for GET
 */
exports.getSiteSecurity = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    console.log(site);
    if (!site.stack) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.stack);
  });

} // function





/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

