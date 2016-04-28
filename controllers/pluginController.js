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
      namespace: site.stack ? site.stack.application.version.replace('.', '') : null,
      version: site.stack ? site.stack.application.version : null
    });
    //console.log('PLUGINS TO LOOKUP', site.plugins);
    var dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - 7);
    site.plugins.forEach(function(item, i) {

      functions.push(function( cb ) {
        Plugin.findOne( { name: item.namespace } )
        .then(function (plugin) {
          //console.log('PLUGIN FOUND', plugin);

          if (plugin === null || dateCutoff > plugin.fetched) {
            getWordPressPluginVulnerabilities(item.type ? item.type : 'plugins', item.namespace, function(err, data) {
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
      var out = [];
      
      for (var i in results) {
        var plugin = results[i];
        if (plugin && plugin.vulnerabilities) {

          var vulnerabilities = [];
          var item = site.plugins.filter(function(v){
            return v.namespace == plugin.name;
          });
          //console.log('PLUGIN', plugin);
          if (item) {
            item = item[0];
            plugin.vulnerabilities.forEach(function(vulnerability, j) {
              //item.version = '0.0.0'; // @todo: this is for testing only!!!
              if (vulnerability.fixed_in > item.version) {
                vulnerabilities.push(vulnerability);
              }
            });
            if (vulnerabilities.length) {
              plugin.vulnerabilities = vulnerabilities;
              out.push(plugin);
            }
          }

        } // if (plugin && plugin.vulnerabilities)
      }; // forEach

      return res.status(200).json( out );

    }); // async 

  });
} // function


// Pings wpvulndb.com to get information about WordPress plugin vulnerabilities
var getWordPressPluginVulnerabilities = function(type, name, cb) {
  // Known plugins without a release
  if (name.indexOf('hello.php') !== -1 || name.indexOf('GovReady') !== -1) {
    return cb(true, null);
  }

  var url = 'https://wpvulndb.com/api/v2/' + type +'/'+ name;
  
  request(url, function (err, res, body) {
    console.log('CALLING WPVULNDB ('+ res.statusCode +'): ' + url);
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      // Clean up the output, check if this is a WordPress Core call
      var key = Object.keys(body)[0];
      data = body[key];
      data.name = name;
      data.fetched = Date.now();
      if (key != name) {
        data.version = key;
        data.application = 'wordpress';
        data.type = 'application';
      }
      plugin = new Plugin(data);
      plugin.save();
      console.log('SAVING PLUGIN: '+plugin);
    }
    else if (!err) {
      plugin = new Plugin( {
        name: name,
        fetched: Date.now()
      });
      plugin.save();
      err = body;
      data = null;
    }
    cb(err, data);
  });
}



/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

