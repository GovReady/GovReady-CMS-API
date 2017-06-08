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
 * Endpoint /sites/:siteId/measures?limitgit  for GET
 */
exports.getSiteMeasures = function(req, res) {

  var limit = req.query.limit && req.query.limit < 100 ? req.query.limit : 100;

  Site.findOne( { _id: req.params.siteId } )
  .limit(limit)
  .then(function (site) {
    
    Measure.find( { siteId: req.params.siteId } )
    .then(function (measures) {

      /*functions = [];
      measures.forEach(function(item, i) {

        functions.push(function( cb ) {
          Submission.findOne( { measureId: item._id } )
          .then(function (submission) {
            cb(null, submission);
          });
        }); // push

      }); // forEach

      async.parallel(functions, function(err, results){
        
        results.forEach(function(item, i) {
          
        });

      }); // async*/
      return res.status(200).json(measures);  
    });

  });
} // function


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
      due: req.body.due
    });
    measure.save();

    return res.status(200).json(measure);  
  });
  //return res.status(500).json({ err: 'No site found' });  

} // function


/** 
 * Endpoint /sites/:siteId/measures/load/:measureStack for POST
 */
exports.postSiteMeasuresLoad = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    console.log('/../data/measures-' + req.params.measureStack + '.yml');

    try {
      var doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../data/measures-' + req.params.measureStack + '.yml', 'utf8'));

      var measures = [];
      doc.forEach(function(item, i) {
      
        // Set some values
        item.frequency = parseInt(item.frequency);
        item.siteId = req.params.siteId;
        var datetime = new Date();
        item.due = datetime.setSeconds(datetime.getSeconds() + item.frequency);

        // Create monogo Measure
        var measure = new Measure(item);
        measure.save();
        measures.push(measure);

        // Deal with submissions that should be added (demo content)
        if (item.submissions != undefined) {
          item.submissions.forEach(function(submission, s) {
            submission.siteId = req.params.siteId;
            submission.measureId = measure._id;
            var submissionElement = new Submission(submission);
            submissionElement.save();
          });
        }

      }); // forEach

      if (res != undefined) {
        return res.status(200).json(measures);
      }
      console.log('Imported '+measures.length+' measures');
      return measures;

    } catch (e) {
      return res.status(500).json({ err: 'Measure stack '+ req.params.measureStack +' not found.' });
    }

    //return res.status(200).json(measure);  
  });
  //return res.status(500).json({ err: 'No site found' });  

} // function




/** 
 * Endpoint /sites/:siteId/measures for POST
 */
exports.getSiteMeasure = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    // Create monogo Measure            
    Measure.findOne( { _id: req.params.measureId } )
    .then(function (measure) {
      return res.status(200).json(measure);
    });

  });
  //return res.status(500).json({ err: 'No site found' });  

} // function


/** 
 * Endpoint /sites/:siteId/contacts/:contactId for PATCH
 */
exports.patchSiteMeasure = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    Measure.findOne( { _id: req.params.measureId } )
    .then(function (measure) {
      
      measure = merge(measure, req.body);
      measure.save();
      return res.status(200).json( measure );

    });

  });

} // function


/** 
 * Endpoint /sites/:siteId/submissions?limit for GET
 */
exports.getSiteSubmissions = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    var limit = req.query.limit && req.query.limit < 100 ? req.query.limit : 20;

    Submission.find( { siteId: req.params.siteId } )
    .sort([['datetime', -1]])
    .limit(limit)
    .then(function (submissions) {
      var ids = [];
      submissions.forEach(function(item, i) {
        ids.push(item.measureId);
      });

      Measure.find( { _id: { $in: ids } } )
      .then(function (measures) {

        submissions.forEach(function(s, i) {
          measures.forEach(function(m, j) {
            if ( m._id.equals(s.measureId) ) {
              submissions[i] = submissions[i].toObject();
              submissions[i].title = m.title;
            }
          });
        });
        return res.status(200).json(submissions);  
        
      }); // Measure.find();

    }); // Submission.find();

  }); //Site.findOne();

} // function


/** 
 * Endpoint /sites/:siteId/measures/:measureId/submissions?limit for GET
 */
exports.getSiteMeasuresSubmissions = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    Measure.findOne( { _id: req.params.measureId } )
    .then(function (measure) {

      var limit = req.query.limit && req.query.limit < 100 ? req.query.limit : 100;

      Submission.find( { measureId: req.params.measureId } )
      .sort([['datetime', -1]])
      .limit(limit)
      .then(function (submissions) {
        return res.status(200).json(submissions);
      });

      return res.status(200).json(submission);  
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
        siteId: req.params.siteId, 
        measureId: req.params.measureId,
        name: req.body.name,
        body: req.body.body,
        //data: {},
        datetime: new Date()
      });
      submission.save();

      // Set the measure due date
      measure.datetime = new Date();
      measure.due = measure.datetime;
      measure.due = measure.due.setSeconds(measure.due.getSeconds() + measure.frequency);
      measure.save();

      return res.status(200).json(submission);  
    });

  });

} // function
