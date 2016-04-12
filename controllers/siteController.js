// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');

var helpers = require('../controllers/helpersController');

/** 
 * Endpoint /initialize for POST
 */
exports.getSite = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    return res.status(200).json(site);  
  });

} // function


/*
router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);
*/