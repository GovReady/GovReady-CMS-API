// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var Plugin = require('../models/pluginModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');
var cmp = require('semver-compare');

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
      return res.status(500).json({err: 'Could not find any accounts'});  
    }

    //var timestamp = Math.floor(Date.now() / 1000) - 2592000; // 30 days ago
    //var accounts = [];
    //site.accounts.forEach(function(item, i) {
    //  if (item.lastLogin == '' || item.lastLogin < timestamp) {
    //    accounts.push(item);
    //  }
    //}); // forEach
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
    site.save();
    return res.status(200).json(site);  
  });

} // function


/** 
 * Endpoint /sites/:siteId/plugins for GET
 */
exports.getSitePlugins = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    //if (!site.plugins) { // @todo?
    //  return res.status(500).json();  
    //}

    var platform = site.stack.application.platform.toLowerCase();
    var names = [];
    var plugins = {};
    site.plugins.forEach(function(item, i) {
      // We only care about installed plugins
      if ( parseInt(item.status) ) {
        names.push(item.namespace);
        plugins[item.namespace] = item;
      }
    });

    Plugin.find( {name: {$in: names}, platform: platform } )
    .then(function (dbPlugins) {
      dbPlugins.forEach(function(item, i) {

        // See if updates are available 
        if ( cmp(item.latest_version, plugins[item.name].version) > 0 ) {
          plugins[item.name].updates = true;
          
          // Check for security updates
          item.vulnerabilities.forEach(function(v, j) {
            if ( cmp(v.fixed_in, plugins[item.name].version) > 0 ) {
              plugins[item.name].updates = 'security';
            }
          });

        }
        else {
          plugins[item.name].updates = false;
        }

      });

      // Rekey plugins Object as Array
      var out = [];
      for (var i in plugins) {
        out.push(plugins[i]);
      };
      return res.status(200).json(out);

    });


    
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
  
    site.stack = req.body.stack;
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
      var doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../data/' + helpers.siteApplication(site) + '-recommend.yml', 'utf8'));
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
    if (!site.stack) {
      return res.status(500).json();  
    }
    return res.status(200).json(site.stack);
  });

} // function


/** 
 * Endpoint /sites/:siteId/changeMode for POST
 */
exports.postSiteChangeMode = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    site.mode = req.body.mode;
    site.save();
    return res.status(200).json(site.mode);  
  });

} // function




/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

