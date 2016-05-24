// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var Measure = require('../models/measureModel');
var Submission = require('../models/submissionModel');

var request = require('request');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');

var helpers = require('../controllers/helpersController');



/** 
 * Endpoint /sites/:siteId/measure for POST
 */
exports.postSiteMeasure = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    // Create monogo Measure            
    var measure = new Measure({
      siteId: req.params.siteId,
      title: req.body.title,
      body: req.body.body,
      frequency: req.body.frequency,
      datetime: new Date()
    });
    measure.save();

    return res.status(200).json(measure);  
  });
  //return res.status(500).json({ err: 'No site found' });  

} // function


/** 
 * Endpoint /sites/:siteId/measure for POST
 */
exports.getSiteMeasures = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    Measure.find( { siteId: req.params.siteId } )
    .then(function (measures) {
      return res.status(200).json(measures);  
    });

  });
} // function
