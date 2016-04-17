// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');

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
  
    console.log('Stack', site.stack);
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

