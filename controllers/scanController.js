// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var Scan = require('../models/scanModel');

var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');

var helpers = require('../controllers/helpersController');



/** 
 * Endpoint /sites/:siteId/scans?name for GET
 */
exports.getSiteScans = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    var params = { siteId: req.params.siteId };
    if (req.query.name) {
      params.name = req.query.name;
    }
    Scan.find( params ).select('-data')
    .then(function (scans) {
      return res.status(200).json(scans);  
    });
  });
} // function

/** 
 * Endpoint /sites/:siteId/scans/:scanId for GET
 */
exports.getSiteScan = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    Scan.findOne( { _id: req.params.scanId } )
    .then(function (scan) {
      return res.status(200).json(scan);  
    });

  });
} // function

/** 
 * Endpoint /sites/:siteId/scan for POST
 */
exports.postSiteScan = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    // Create monogo Measure            
    var scan = new Scan({
      siteId: req.params.siteId,
      datetime: Date.now(),
      name: req.body.name,
      result: req.body.result ? req.body.result : null,
      data: req.body.data ? JSON.parse(req.body.data) : null
    });
    scan.save();

    return res.status(200).json(scan);  
  });

} // function

