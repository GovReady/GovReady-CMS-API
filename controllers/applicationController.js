// Load required packages
var feedparser = require('feedparser');
// WordPress RSS feed has faulty headers, so we need this
// From http://stackoverflow.com/questions/36628420/nodejs-request-hpe-invalid-header-token
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;
var request = require('request');

var helpers = require('../controllers/helpersController');

/** 
 * Endpoint /applications/:app/news for GET
 */
exports.getApplicationNews = function(req, res) {

  switch (req.params.app) {
    case 'wordpress':
      var url = 'https://wordpress.org/news/feed/';
      //var url = 'https://wordpress.org/news/category/security/feed/'; // @todo: change?
      break;
  }
  console.log(url);

  request(url, function (err, response, body) {
    console.log(err);
  });
  

  feedparser.parseString(string)
    .on('article', console.log);


} // function



/** 
 * Endpoint /applications POST
 */
exports.postApplication = function(req, res) {

  var app = new Application(req.body);
  app.save();
  return res.status(200).json( app ); 

} // function


/** 
 * Endpoint /applications for GET
 */
exports.getApplications = function(req, res) {
  
  Application.find( {} )
  .then(function (applications) {
    
    return res.status(200).json( applications ); 

  });
    
} // function


/** 
 * Endpoint /applications/:application for GET
 */
exports.getApplication = function(req, res) {
  
  Application.findOne( { name: req.params.application } )
  .then(function (application) {
    
    return res.status(200).json( application ); 

  });
    
} // function


