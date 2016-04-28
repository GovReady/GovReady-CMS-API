// Load required packages
var request = require('request');
var feed = require("feed-read");
 



var helpers = require('../controllers/helpersController');

/** 
 * Endpoint /applications/:app/news for GET
 */
exports.getApplicationNews = function(req, res) {

  switch (req.params.app) {
    case 'wordpress':
      // Official WordPress RSS feed has faulty headers, so we're using an interesting feed from
      // http://www.wpsecuritybloggers.com/category/wordpress
      var url = 'http://www.wpsecuritybloggers.com/category/wordfence/feed';
      //var url = 'http://www.wpsecuritybloggers.com/category/wp-white-security/feed';
      //var url = 'https://wordpress.org/news/category/security/feed/'; // @todo: change?
      break;
  }

  feed(url, function(err, articles) {
    if (err) throw err;

    return res.status(200).json( articles ); 
  });

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


