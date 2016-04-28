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
var async = require('async');

var helpers = require('../controllers/helpersController');
var site = require('../controllers/siteController');

/** 
 * Endpoint /plugins for GET
 */
exports.getPlugins = function(req, res) {

  Plugin.find( {} )
  .then(function (plugins) {
    
    return res.status(200).json( plugins );
    
  });

} // function

/** 
 * Endpoint /sites/:siteId/vulnerabilities for GET
 */
exports.getSiteVulnerabilities = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    var functions = [];
    site.plugins.unshift({
      type: 'wordpresses',
      name: site.stack ? site.stack.application.version.replace('.', '') : null,
      version: site.stack ? site.stack.application.version : null
    });
    var dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - 7);
    site.plugins.forEach(function(item, i) {

      functions.push(function( cb ) {
        Site.findOne( { name: item.namespace } )
        .then(function (plugin) {

          if (plugin === null || dateCutoff > plugin.fetched) {
            getWordPressPluginVulnerabilities('plugins', item.namespace, function(err, data) {
              cb(err, data);
            });
          }
          else {
            cb(null, plugin);
          }

        });
      }); // push

    }); // forEach

    async.parallel(functions, function(err, results){
      console.log(results);
      console.log(console.log(site.plugins));
      var out = [];
      
      results.forEach(function(plugin, i) {
        var vulnerabilities = [];
        var item = site.plugins.filter(function(v){
          return v.namespace == plugin.name;
        });
        if (item) {
          plugin.vulnerabilities.forEach(function(vulnerability, j) {
            if (vulnerability.fixed_in < item.version) {
              vulnerabilities.push(vulnerability);
            }
          });
          if (vulnerabilities.length) {
            plugin.vulnerabilities = vulnerabilities;
            out.push(plugin);
          }
        }
        
        console.log(plugin.name);
        console.log(item);

        //if ()
      }); // forEach
    }); // async 


    return res.status(200).json();

  });
} // function


var getWordPressPluginVulnerabilities = function(type, name, cb) {
  var url = 'https://wpvulndb.com/api/v2/' + type +'/'+ name;
  
  request(url, function (err, res, body) {
    console.log('CALLING WPVULNDB ('+ res.statusCode +'): ' + url);
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      body = body[name];
      body.name = name;
      body.fetched = Date.now();
      plugin = new Plugin(body);
      plugin.save();
      console.log(plugin);
    }
    cb(err, body);
  });
}



/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

