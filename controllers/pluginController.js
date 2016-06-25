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
var parseString = require('xml2js').parseString;

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

    if (!site) {
      return res.status(500).json( {err: 'no site'} );
    }

    if (!site.stack || !site.stack.application) {
      return res.status(500).json( {err: 'site.stack does not yet exist'} );
    }

    var functions = [];
    var dateCutoff = new Date();

    var platform = site.stack.application.platform.toLowerCase();


    switch ( platform ) {
      case 'wordpress':
        site.plugins.unshift({
          type: 'wordpresses',
          namespace: site.stack.application.version.replace('.', ''),
          version: site.stack.application.version
        });
        break;
      case 'drupal':
        var version = site.stack.application.version;
        var arrVersion = version.split('.');
        var majorVersion = arrVersion[0] + '.x';
        site.plugins.unshift({
          type: majorVersion,
          namespace: platform,
          version: version
        });
        break;
    }

    //site.plugins = [site.plugins[0]];  // @todo: only use this for debugging
    //console.log('PLUGINS TO LOOKUP', site.plugins);

    dateCutoff.setDate(dateCutoff.getDate() - 7);
    site.plugins.forEach(function(item, i) {

      functions.push(function( cb ) {
        Plugin.findOne( { name: item.namespace, platform: platform } )
        .then(function (plugin) {
          console.log('PLUGIN FOUND', item.namespace, plugin);

          // We don't have a plugin, or we haven't fetched data for a while: ping updates site
          //console.log(dateCutoff , plugin.fetched);
          if (plugin === null || dateCutoff > plugin.fetched) {
            console.log('LOOKING UP', item.namespace, platform);
            //Plugin.remove( { name: item.namespace, platform: platform } );
            switch ( platform ) {
              case 'wordpress':
                getWordPressPluginVulnerabilities(item.type ? item.type : 'plugins', item.namespace, function(err, data) {
                  cb(err, data);
                });
                break;
              case 'drupal':
                getDrupalModuleVulnerabilities(item.type ? item.type : majorVersion, item.namespace, function(err, data) {
                  cb(err, data);
                });
                break;
            }
          }
          // Return the plugin from the db
          else {
            cb(null, plugin);
          }

        });
      }); // push

    }); // forEach

    async.series(functions, function(err, results){
      var out = [];
      
      //console.log('PLUGIN RESULTS', results);
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
              //console.log(vulnerability.fixed_in, item.version);
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
// Type is "plugin" or "theme" in WordPress, major version in Drupal
var getWordPressPluginVulnerabilities = function(type, name, cb) {
  // Known plugins without a release
  if (name.indexOf('hello.php') !== -1 || name.indexOf('GovReady') !== -1) {
    return cb(true, null);
  }

  var url = 'https://wpvulndb.com/api/v2/' + type +'/'+ name;
  
  request(url, function (err, res, body) {
    //console.log('CALLING WPVULNDB ('+ res.statusCode +'): ' + url);
    if (!err && res.statusCode == 200) {
      body = JSON.parse(body);
      // Clean up the output, check if this is a WordPress Core call
      var key = Object.keys(body)[0];
      data = body[key];
      data.platform = 'wordpress';
      data.name = name;
      data.fetched = Date.now();
      if (key != name) {
        data.version = key;
        data.application = 'wordpress';
        data.type = 'application';
      }
      plugin = new Plugin(data);
      plugin.save();
      //console.log('SAVING PLUGIN: '+plugin);
    }
    else if (!err) {
      plugin = new Plugin( {
        name: name,
        platform: 'wordpress',
        fetched: Date.now()
      });
      plugin.save();
      err = body;
      data = null;
    }
    cb(err, data);
  });
}


// Pings wpvulndb.com to get information about Drupal module vulnerabilities
var getDrupalModuleVulnerabilities = function(type, name, cb) {

  var url = 'https://updates.drupal.org/release-history/' + name +'/'+ type;
  console.log(url);
  
  request(url, function (err, res, body) {
    //console.log('CALLING WPVULNDB ('+ res.statusCode +'): ' + url);
    if (!err && res.statusCode == 200 && body.indexOf('<error>') == -1) {

      parseString(body, function (err, body) {
        var data = {
          platform:'drupal',
          name: name,
          fetched: Date.now(),
          vulnerabilities: [],
          latest_version: body.project.releases[0].release[0].version[0]
        }

        for (var i in body.project.releases[0].release) {
          var release = body.project.releases[0].release[i];

          if (release.terms && release.terms[0].term[0].value[0] == 'Security update') {
            data.vulnerabilities.push({
              "title": release.name[0],
              "created_at": new Date( parseInt(release.date[0])*1000 ).toISOString(),
              "references": {
                "url": [
                  release.release_link[0]
                ],
              },
              "fixed_in": release.version[0]
            });
          }

        } // for
        
        //console.dir(body.project.releases[0].release[0].terms[0].term);
        //var key = Object.keys(body)[0];
        //data = body[key];
        data.platform = 'drupal';
        data.name = name;
        data.fetched = Date.now();
        
        plugin = new Plugin(data);
        plugin.save();
        return cb(err, data);
      });

    }
    else if (!err) {
      plugin = new Plugin( {
        name: name,
        platform: 'drupal',
        fetched: Date.now()
      });
      plugin.save();
      err = body;
      data = null;
      return cb(null, plugin);
    }
    else {
      return cb(err, null);
    }

  });
}

/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

