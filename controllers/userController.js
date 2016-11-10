// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var Auth0 = require('auth0');

var helpers = require('../controllers/helpersController');

var ManagementClient = require('auth0').ManagementClient;
var AuthenticationClient = require('auth0').AuthenticationClient;

var auth0 = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
});

var management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  token: process.env.AUTH0_TOKEN,
});


/*
router.route('/initialize')
  .post(helpers.jwtCheck, userController.postInitialize);

router.route('/token')
  .post(helpers.jwtCheck, userController.postToken);


router.route('/users')
  .post(helpers.jwtCheck, userController.postUser);

router.route('/users/:userId')
  .get(helpers.jwtCheck, userController.getUser)
  .put(helpers.jwtCheck, userController.putUser)
  .delete(helpers.jwtCheck, userController.deleteUser);
*/

/** 
 * Endpoint /initialize for POST
 */
exports.postInitialize = function(req, res) {
  // Does a site entry already exist?
  Site.findOne( { url: req.body.url } ).then(function (site) {
    
    // Does a Site object already exist?
    // Note: we disable de-duping by site.url in https://github.com/GovReady/GovReady-CMS-API/issues/29
    /*
    if  {
      var out = {
        _id: site._id,
        url: site.url,
        status: site.status
      }
      return res.status(200).json( out );
    }
    */

    // Update the allowed_origins (CORS) in Auth0 and created the Site object
    if (!site) {
      // Get the Client (application) object
      management
        .clients.get( { client_id: process.env.AUTH0_CLIENT_ID } )
        .then(function (client) {
          // Update the Auth0 Client
          client.allowed_origins.push( req.body.url );
          var data = {
            allowed_origins: client.allowed_origins
          }
          management
            .clients.update( { client_id: process.env.AUTH0_CLIENT_ID }, data )
            .then(function (client) {

              return res.status(200).json({success: true});

            })
            .catch(function (err) {
              
              // Likely the allowed_origins entry already exists, so we fail gracefully
              return res.status(200).json({success: true});

            }); // auth0.clients.update()

        })
        .catch(function (err) {
          return res.status(500).json(err);
        }); // auth0.clients.get()
    }

    // No need to update cors, just create the mongo Site
    else {
      createSite(req, function(err, site){
        return res.status(200).json({success: true});
      });
    }
  });

} // function

// Helper function creates mongo Site
var createSite = function(req, cb) {
  // Create monogo Site            
  var site = new Site({
    url: req.body.url,
    application: req.body.application,
    status: {}
  });
  site.save(function(err, site) {
    console.log('ERROR SAVING SITE', err);
    cb(err, site);
  });
  
}



/** 
 * Endpoint /refresh-token for POST (anonymous endpoint)
 */
exports.postRefreshToken = function(req, res) {

  var data = {
    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", // @todo?
    'target': process.env.AUTH0_CLIENT_ID,
    'client_id': process.env.AUTH0_CLIENT_ID,
    "refresh_token": req.body.refresh_token,
    "api_type": "app",
    'scope': 'openid app_metadata'
  };

  // Note: auth0.tokens.getDelegationToken() requires an id_token parameter, which we don't necessarily
  // have, so we call https://govready.auth0.com/delegation manually.
  var requestData = {
    url: 'https://' + process.env.AUTH0_DOMAIN + '/delegation',
    json: true,
    method: 'POST',
    body: data
  };
  //console.log(requestData);
  request(requestData, function (err, response, body) {
    if (err || !response.body.id_token) {
      return res.status(500).json(err);
    }

    return res.status(200).json(response.body);
  });

  // Add the site to the user
  // Get the User object
  /*
*/

} // function



/** 
 * Endpoint /user-site for POST (anonymous endpoint)
 */
exports.postUserSite = function(req, res) {
  return exports.addUserSite(req.user, req.params.siteId, 'administrator', function(err, user) {
    res.status(200).json(user.app_metadata);
  });
}


/** 
 * Endpoint /sites for GET
 */
exports.getSites = function(req, res) {
  management
    .users.get( { id: req.user.sub } )
    .then(function (user) {console.log(user);
      // Update the Auth0 Client
      var items = [];
      var role, index;
      if (user.app_metadata == undefined || user.app_metadata.sites == undefined) {
        return res.status(200).json([]);
      }
      for (var i in user.app_metadata.sites) {
        items.push(user.app_metadata.sites[i].siteId);
      }
      Site.find( { _id: { $in: items } } )
        .then(function (sites) {
          var out = [];
          var site;
          for (var i in sites) {
            site = sites[i];

            index = user.app_metadata.sites.map(function(el) {
              return el.siteId;
            }).indexOf(String(site._id));

            role = user.app_metadata.sites[index].role;

            out.push({
              title: site.title ? site.title : site.url,
              url: site.url,
              siteId: site._id,
              application: site.application ? site.application : null,
              applicationOther: site.applicationOther ? site.applicationOther : null,
              role: role
            });
          }

          return res.status(200).json(out);

        });
        //.else(function (err) {
        //  return res.status(200).json(out);console.log(err);
        //});
    });

}


/** 
 * Helper function adds a user to a site in Auth0.
 */
exports.addUserSite = function(rUser, siteId, role, cb) {

  management
    .users.get( { id: rUser.sub } )
    .then(function (user) {
      // Update the Auth0 Client
      var data = {
        app_metadata: user.app_metadata ? user.app_metadata : {}
      }
      data.app_metadata.sites = user.app_metadata.sites ? user.app_metadata.sites : [];
      
      // Add the site to the user
      var index = data.app_metadata.sites.map(function(el) {
        return el.siteId;
      }).indexOf(siteId);
      if ( index == -1 ) {
        data.app_metadata.sites.push({
          siteId: siteId,
          role: role
        });

        management
          .users.update( { id: rUser.sub }, data )
          .then(function (client) {
            return cb(null, user);
          })
          .catch(function (err) {
            return cb(err, null);
          }); // auth0.users.update()

      } // if
      else {
        return cb('User already belongs to site', null);
      }

    })
    .catch(function (err) {
      return cb(err, null);
    }); // auth0.clients.get()

} 


/** 
 * Helper function removes a user from a site in Auth0.
 */
exports.removeUserSite = function(rUser, siteId, cb) {

  management
    .users.get( { id: rUser.sub } )
    .then(function (user) {
      // Update the Auth0 Client
      var data = {
        app_metadata: user.app_metadata ? user.app_metadata : {}
      }
      data.app_metadata.sites = user.app_metadata.sites ? user.app_metadata.sites : [];
      
      // Remove the site from the user
      var index = data.app_metadata.sites.map(function(el) {
        return el.siteId;
      }).indexOf(String(siteId));
      //console.log('index', index, typeof siteId);
      if ( index != -1 ) {
        data.app_metadata.sites.splice(index, 1);
        //console.log(data);

        management
          .users.update( { id: rUser.sub }, data )
          .then(function (client) {
            return cb(null, user);
          })
          .catch(function (err) {
            //console.log('err saving user', err);
            //return cb('Error saving user', null);
            return cb(err, user);
          }); // auth0.users.update()

      } // if
      else {
        console.log('User does not belong to site');
        return cb('User already belongs to site', null);
      }

    })
    .catch(function (err) {
      console.log('MANAGEMENT ERR', err);
      return cb(err, null);
    }); // auth0.clients.get()
    
}


/** 
 * Endpoint /token for POST
 */
exports.postUser = function(req, res) {

  var out = {};
  res.status(status).json(out);
  
} // function

