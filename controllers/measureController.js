// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var Measure = require('../models/measureModel');
var Submission = require('../models/submissionModel');
var async = require('async');
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

  var limit = req.query.limit && parseInt(req.query.limit) < 100 ? parseInt(req.query.limit) : 100;

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
    measure.save(function() {
      res.status(200).json(measure);
    });
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

    var doc;
    try {
      doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../data/measures-' + req.params.measureStack + '.yml', 'utf8'));
    } catch (e) {
      return res.status(500).json({ err: 'Measure stack '+ req.params.measureStack +' not found.' });
    }

    // Run sync async
    var measures = async.mapSeries(
      doc,
      // each measure from doc
      function (item, meaureCallback) {
        // Set some values
        item.frequency = parseInt(item.frequency);
        item.siteId = req.params.siteId;
        var datetime = new Date();
        item.due = datetime.setSeconds(datetime.getSeconds() + item.frequency);
        var measure = new Measure(item);
        // Save
        measure.save(function () {
          // Deal with submissions that should be added (demo content)
          if (item.submissions != undefined) {
            // Run sync async
            async.mapSeries(
              item.submissions,
              // each submission
              function (submission, submissionCallback) {
                submission.siteId = req.params.siteId;
                submission.measureId = measure._id;
                // @TODO remove this since we're now saving to submission
                if (!submission.title) {
                  submission.title = measure.title;
                }
                var submissionElement = new Submission(submission);
                // Save
                submissionElement.save(function (error) {
                  submissionCallback();
                });
              },
              // Done
              function (err, results) {
                meaureCallback(measure);
              }
            );
          }
        });
      },
      // Done
      function (err, results) {
        console.log('Imported ' + measures.length + ' measures');
        if (res != undefined) {
          return res.status(200).json(results);
        }
      }
    );
  });
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
      res.status(200).json(measure);
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
      measure.save(function (saveErr) {
        if (saveErr) {
          return res.status(500).json(saveErr);
        }
        res.status(200).json(measure);
      });
    });

  });

} // function


/** 
 * Endpoint /sites/:siteId/submissions?limit for GET
 */
exports.getSiteSubmissions = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    var limit = req.query.limit && parseInt(req.query.limit) < 100 ? parseInt(req.query.limit): 20;
    console.log('LIMIT'+limit);

    Submission.find( { siteId: req.params.siteId } )
    .sort([['datetime', 1]])
    .limit(limit)
    .then(function (submissions) {
      var ids = [];
      submissions.forEach(function(item, i) {
        ids.push(item.measureId);
      });

      Measure.find( { _id: { $in: ids } } )
      .then(function (measures) {
        // @TODO remove this since we're now saving to submission
        submissions.forEach(function(s, i) {
          measures.forEach(function(m, j) {
            if ( m._id.equals(s.measureId) && !submissions[i].title ) {
              submissions[i] = submissions[i].toObject();
              submissions[i].title = m.title;
            }
          });
        });
        return res.status(200).json(submissions);  
        
      }); // Measure.find();

    }); // Submission.find();

  }).catch(function(e) {
    console.log(e);
    return res.status(200).json([]);
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

      var limit = req.query.limit && parseInt(req.query.limit) < 100 ? parseInt(req.query.limit) : 100;
      Submission.find( { measureId: req.params.measureId } )
      .sort([['datetime', 1]])
      .limit(limit)
      .then(function (submissions) {
        // @TODO remove this since we're now saving to submission
        submissions.forEach(function(s, i) {
          if(!submissions[i].title) {
            submissions[i] = submissions[i].toObject();
            submissions[i].title = measure.title;
          }
        });
        return res.status(200).json(submissions);
      });

      // return res.status(200).json(submission);
    });

  }).catch(function(e) {
    console.log(e);
    return res.status(200).json([]);
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
        title: measure.title,
        datetime: new Date()
      });

      submission.save(function() {
        // Set the measure due date
        measure.datetime = new Date();
        measure.due = measure.datetime;
        measure.due = measure.due.setSeconds(measure.due.getSeconds() + measure.frequency);
        measure.save(function() {
          res.status(200).json(submission);
        });
      });
    });

  }).catch(function(e) {
    return res.status(500).json(e);
  });

} // function
