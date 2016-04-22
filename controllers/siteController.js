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
      return res.status(500);  
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
      return res.status(500);  
    }
    return res.status(200).json(site.plugins);
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


/** 
 * Endpoint /sites/:siteId/stack for GET
 */
exports.getSiteStack = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    console.log(site);
    if (!site.stack) {
      return res.status(500);  
    }
    return res.status(200).json(site.stack);
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
      return res.status(500);
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
      return res.status(500);  
    }
    return res.status(200).json(site.stack);
  });

} // function


/** 
 * Endpoint /sites/:siteId/vulnerabilites for GET
 */
exports.getSiteVulnerabilities = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    var out = 
      {
        'wordpress-4.4': {
          release_date: "2015-12-08",
          changelog_url: "https://codex.wordpress.org/Version_4.4",
          vulnerabilities: [
          {
          id: 8358,
          title: "WordPress 3.7-4.4 - Authenticated Cross-Site Scripting (XSS)",
          created_at: "2016-01-06T20:22:45.000Z",
          updated_at: "2016-01-08T16:08:54.000Z",
          published_date: "2016-01-06T00:00:00.000Z",
          references: {
          url: [
          "https://wordpress.org/news/2016/01/wordpress-4-4-1-security-and-maintenance-release/",
          "https://github.com/WordPress/WordPress/commit/7ab65139c6838910426567849c7abed723932b87"
          ],
          cve: [
          "2016-1564"
          ]
          },
          vuln_type: "XSS",
          fixed_in: "4.4.1"
          },
          {
          id: 8376,
          title: "WordPress 3.7-4.4.1 - Local URIs Server Side Request Forgery (SSRF)",
          created_at: "2016-02-02T19:38:13.000Z",
          updated_at: "2016-02-05T20:14:01.000Z",
          published_date: "2016-02-02T00:00:00.000Z",
          references: {
          url: [
          "https://wordpress.org/news/2016/02/wordpress-4-4-2-security-and-maintenance-release/",
          "https://core.trac.wordpress.org/changeset/36435"
          ],
          cve: [
          "2016-2222"
          ]
          },
          vuln_type: "SSRF",
          fixed_in: "4.4.2"
          },
          {
          id: 8377,
          title: "WordPress 3.7-4.4.1 - Open Redirect",
          created_at: "2016-02-02T19:39:51.000Z",
          updated_at: "2016-02-05T20:06:48.000Z",
          published_date: "2016-02-02T00:00:00.000Z",
          references: {
          url: [
          "https://wordpress.org/news/2016/02/wordpress-4-4-2-security-and-maintenance-release/",
          "https://core.trac.wordpress.org/changeset/36444"
          ],
          cve: [
          "2016-2221"
          ]
          },
          vuln_type: "REDIRECT",
          fixed_in: "4.4.2"
          }
          ]
        },
        'admin-menu-editor': {
          latest_version: "1.6.1",
          last_updated: "2016-04-07T13:43:00.000Z",
          popular: false,
          vulnerabilities: [ ]
        },
        'contact-form-7': {
          latest_version: "4.4.1",
          last_updated: "2016-03-28T23:59:00.000Z",
          popular: false,
          vulnerabilities: [
          {
          id: 7020,
          title: "Contact Form 7 <= 3.7.1 - Security Bypass Vulnerability",
          created_at: "2014-08-01T10:59:06.000Z",
          updated_at: "2015-05-15T13:48:25.000Z",
          published_date: null,
          references: {
          url: [
          "http://www.securityfocus.com/bid/66381/"
          ],
          cve: [
          "2014-2265"
          ]
          },
          vuln_type: "AUTHBYPASS",
          fixed_in: "3.7.2"
          },
          {
          id: 7022,
          title: "Contact Form 7 <= 3.5.2 - File Upload Remote Code Execution",
          created_at: "2014-08-01T10:59:07.000Z",
          updated_at: "2015-05-15T13:48:25.000Z",
          published_date: null,
          references: {
          url: [
          "http://packetstormsecurity.com/files/124154/"
          ]
          },
          vuln_type: "UPLOAD",
          fixed_in: "3.5.3"
          }
          ]
        }
      };

    return res.status(200).json(out);
  });

} // function




/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

