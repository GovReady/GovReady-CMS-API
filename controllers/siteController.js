// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var Plugin = require('../models/pluginModel');
var Contact = require('../models/contactModel');
var Measure = require('../models/measureModel');
var Submission = require('../models/submissionModel');
var Scan = require('../models/scanModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');
var cmp = require('semver-compare');

var helpers = require('../controllers/helpersController');
var userController = require('../controllers/userController');
var pluginController = require('../controllers/pluginController');

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
 * Endpoint /sites for POST
 */
exports.postSite = function(req, res) {
  // Create monogo Site            
  var site = new Site({
    url: req.body.url,
    title: req.body.title ? req.body.title : req.body.url,
    application: req.body.application ? req.body.application : null,
    otherApplication: req.body.otherApplication ? req.body.otherApplication : null,
    status: {}
  });
  site.save(function(saveErr) {
    if (saveErr) {
      return res.status(500).json(saveErr);
    }

    console.log('CREATED NEW SITE', site);

    userController.addUserSite(req.user, site._id, 'administrator', function(err, user) {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json(site);
    });
  });
} // function


/** 
 * Endpoint /sites/:siteId for PATCH
 */
exports.patchSite = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    site = merge(site, req.body);
    site.save(function(saveErr) {
      if (saveErr) {
        return res.status(500).json(saveErr);
      }

      res.status(200).json(site);
    });
  });

} // function


/** 
 * Endpoint /sites/:siteId for DELETE
 */
exports.deleteSite = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    console.log('DELETING SITE', site._id);

    // @TODO do this with async
    Contact.find({ siteId: site._id }).remove().exec();
    Measure.find({ siteId: site._id }).remove().exec();
    Submission.find({ siteId: site._id }).remove().exec();
    Scan.find({ siteId: site._id }).remove().exec();
    Site.findOne({ _id: site._id }).remove().exec();

    userController.removeUserSite(req.user, site._id, function(err, user) {
      if (err) {
        return res.json(err);
      }
      return res.json({
        status: 'success',
        user: user
      });  
    })
    
  })
  .catch(function(err){
    return res.status(403).json({
      status: 'error',
      error: 'Site not found'
    });
  });

} // function

/** 
 * Endpoint /sites/:siteId/load/demo for POST
 */
exports.loadDemoSite = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    // @TODO do this with async
    // Delete old associated Documents
    Contact.find({ siteId: req.params.siteId }).remove().exec();
    Measure.find({ siteId: req.params.siteId }).remove().exec();
    Submission.find({ siteId: req.params.siteId }).remove().exec();
    Scan.find({ siteId: req.params.siteId }).remove().exec();

    // Load in demo content
    var measureController = require('../controllers/measureController');
    var contactController = require('../controllers/contactController');
    req.params.measureStack = req.params.contactStack = 'demo';
    measureController.postSiteMeasuresLoad(req);
    contactController.postSiteContactsLoad(req);

    return res.status(200).json({status: 'success'});  
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
    site.save(function(saveErr) {
      if (saveErr) {
        return res.status(500).json(saveErr);
      }

      res.status(200).json(site);
    });
  });

} // function


/** 
 * Endpoint /sites/:siteId/accounts for GET
 */
exports.getSiteAccounts = function(req, res) {
  
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    if (!site.accounts) {
      //return res.status(500).json({err: 'Could not find any accounts'});
      site.accounts = [];
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
    console.log('\n\n\n----------------');
    console.log('Plugins before');
    console.log(site.plugins);
    console.log('----------------\n\n\n');
    site.plugins = req.body.plugins;
    console.log('\n\n\n----------------');
    console.log('Plugins after');
    console.log(site.plugins);
    console.log('----------------\n\n\n');
    console.log('PLUGINS POST');
    site.save(function (saveErr, doc, success) {
      if (saveErr) {
        return res.status(500).json( saveErr );
      }

      console.log('\n\n\n----------------');
      console.log('SAVED DOC PLUGINS');
      console.log(doc.plugins);
      console.log('----------------\n\n\n');

      pluginController.calculateSiteVulnerabilities(site, function(calcErr, out) {
        if (calcErr) {
          return res.status(500).json( calcError );
        }
        else {
          return res.status(200).json( site );
        }
      });
    });
  });
} // function


/** 
 * Endpoint /sites/:siteId/plugins for GET
 */
exports.getSitePlugins = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    console.log('\n\n\n----------------');
    console.log('GETTING PLUGINS');
    console.log(site);
    console.log('----------------\n\n\n');

    //if (!site.plugins) { // @todo?
    //  return res.status(500).json();  
    //}

    var platform = site.stack.application.platform.toLowerCase();

    // Add core as plugin
    switch ( platform ) {
      case 'wordpress':
        site.plugins.unshift({
          type: 'wordpresses',
          namespace: site.stack.application.version.replace('.', ''),
          version: site.stack.application.version,
          core: true,
          status: true
        });
        break;
      case 'drupal':
        var version = site.stack.application.version;
        var arrVersion = version.split('.');
        var majorVersion = arrVersion[0] + '.x';
        site.plugins.unshift({
          type: majorVersion,
          namespace: platform,
          version: version,
          core: true,
          status: true
        });
        break;
    }

    var names = [];
    var plugins = {};
    site.plugins.forEach(function(item, i) {
      // We only care about installed plugins
      if ( item.status ) {
        names.push(item.namespace);
        plugins[item.namespace] = item;
      }
    });

    Plugin.find( {name: {$in: names}, platform: platform } )
    .then(function (dbPlugins) {
      //console.log(dbPlugins);
      for (var i = 0, len = dbPlugins.length; i < len; i++) {
        var item = dbPlugins[i];

        // See if updates are available
        //plugin.latest_version = item.latest_version != undefined ? item.latest_version : null;
        if ( plugins[item.name].version != null && item.latest_version && cmp(item.latest_version, plugins[item.name].version) > 0 ) {
          plugins[item.name].updates = true;
          //plugin.latest_version = item.latest_version;

          // Check for security updates
          item.vulnerabilities.forEach(function(v, j) {
            if ( v.fixed_in && cmp(v.fixed_in, plugins[item.name].version) > 0 ) {
              plugins[item.name].updates = 'security';
              if (plugins.vulnerabilities == undefined) {
                plugins[item.name].vulnerabilities = [];
              }
              plugins[item.name].vulnerabilities.push(v);
            }
          });

        }
        else {
          plugins[item.name].updates = false;
        }
        //console.log('asd', i, len, item);

      }

      // Rekey plugins Object as Array
      var out = {
        core: [],
        plugins: []
      };
      for (var i in plugins) {
        var key = plugins[i].core ? 'core' : 'plugins';
        out[key].push(plugins[i]);
      };
      // // Add status
      // if (site.status && site.status.plugins) {
      //   out.lastStatus = site.status.plugins;
      // }
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
    console.log('\n\n\n----------------');
    console.log('NEW STACK', req.body.stack);
    console.log('----------------\n\n\n');
    site.stack = req.body.stack;
    console.log('\n\n\n----------------');
    console.log('NEW SITE STACK', site.stack, site._id);
    console.log('----------------\n\n\n');
    site = new Site(site);
    site.save(function (saveErr, doc, success) {
      if(saveErr) {
        console.log('ERROR!!!', err, doc._id, success);
        return res.status(200).json(site);
      }
      console.log('\n\n\n----------------');
      console.log('NEW SITE STACK', doc.stack, doc._id);
      console.log(site.plugins);
      console.log('----------------\n\n\n');
      res.status(200).json(site);
      // saved!
    });
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
    // Add status
    // if (site.status && site.status.stack) {
    //   site.stack.lastStatus = site.status.stack;
    // }
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
console.log('REC');
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    try {
      console.log(__dirname + '/../data/');
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
    site.save(function(saveErr) {
      if (saveErr) {
        return res.status(500).json(saveErr);
      }

      res.status(200).json(site.mode);
    });
  });

} // function


/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);

*/   

