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
 * Endpoint /sites/:siteId/measures for POST
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
 * Endpoint /sites/:siteId/measures for GET
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


/** 
 * Endpoint /sites/:siteId/measures/:measureId/submissions for POST
 */
exports.postSiteMeasuresSubmission = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    Measure.findOne( { _id: req.params.measureId } )
    .then(function (measure) {

      // Create monogo Submission            
      var submission = new Submission({
        measureId: req.params.measureId,
        name: req.body.name,
        body: req.body.body,
        //data: {},
        datetime: new Date()
      });
      submission.save();

      return res.status(200).json(submission);  
    });

  });

} // function


/** 
 * Endpoint /sites/:siteId/measures/:measureId/submissions for GET
 */
exports.getSiteMeasuresSubmissions = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    Measure.findOne( { _id: req.params.measureId } )
    .then(function (measure) {

      Submission.find( { measureId: req.params.measureId } )
      .then(function (submissions) {
        return res.status(200).json(submissions);  
      });

      return res.status(200).json(submission);  
    });

  });

} // function