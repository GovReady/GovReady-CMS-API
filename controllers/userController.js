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
console.log(req.body.url);
  // Does a site entry already exist?
  Site.findOne( { url: req.body.url } ).then(function (site) {
    
    // Does a Site object already exist?
    if (site) {
      var out = {
        _id: site._id,
        url: site.url,
        status: site.status
      }
      return res.status(200).json( out );
    }
    // Update the allowed_origins (CORS) in Auth0 and created the Site object
    else {
      // Get the Client (application) object
      management
        .clients.get( { client_id: process.env.AUTH0_CLIENT_ID } )
        .then(function (client) {
          console.log(client);

          // Update the Auth0 Client
          client.allowed_origins.push( req.body.url );
          var data = {
            allowed_origins: client.allowed_origins
          }
          management
            .clients.update( { client_id: process.env.AUTH0_CLIENT_ID }, data )
            .then(function (client) {
              // Create monogo Site            
              var site = new Site({
                'url': req.body.url,
                status: 0
              });
              site.save();

              return res.status(200).json(site);

            })
            .catch(function (err) {
              return res.status(500).json(err);
            }); // auth0.clients.update()

        })
        .catch(function (err) {
          return res.status(500).json(err);
        }); // auth0.clients.get()
    }
  });

} // function


/** 
 * Endpoint /refresh-token for POST (anonymous endpoint)
 */
exports.postRefreshToken = function(req, res) {

  var data = {
    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", // @todo?
    'target': process.env.AUTH0_CLIENT_ID,
    'client_id': process.env.AUTH0_CLIENT_ID,
    "refresh_token": 'iI3KDzXwjD8fLy3MVJLXqveknV0y93XhomEMEmGeXBdMk',//req.body.refresh_token,
    "api_type": "app",
    'scope': 'openid'
  };

  // Note: auth0.tokens.getDelegationToken() requires an id_token parameter, which we don't necessarily
  // have, so we call https://govready.auth0.com/delegation manually.
  var requestData = {
    url: 'https://' + process.env.AUTH0_DOMAIN + '/delegation',
    json: true,
    method: 'POST',
    body: data
  };
  console.log(requestData);
  request(requestData, function (err, response, body) {
    if (err || !response.body.id_token) {
      return res.status(500).json(err);
    }
    return res.status(200).json(response.body);
  });


} // function







/** 
 * Endpoint /token for POST
 */
exports.postUser = function(req, res) {

  var out = {};
  res.status(status).json(out);
  
} // function
