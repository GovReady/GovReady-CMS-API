// Load required packages
var User = require('../models/userModel');
var Site = require('../models/siteModel');
var request = require('request');
var http = require('http');
var jwt = require('jsonwebtoken');
var crypto = require("crypto");
var merge = require('lodash/merge');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var htmlToText = require('html-to-text');
var jwt = require('express-jwt');
var RedisSMQ = require("rsmq");
var basicAuth = require('basic-auth');

var rsmq = new RedisSMQ( {host: process.env.RABBITMQ_SERVER, port: process.env.RABBITMQ_PORT, ns: "rsmq"} );

// Check jwt tokens in `res`
exports.jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

// Check that the user has access to edit the site
exports.siteAccessCheck = function(req, res, next) {
  if (req.params.siteId) {
    if ( !( req.user.app_metadata && req.user.app_metadata.sites.length && req.user.app_metadata.sites.indexOf(req.params.siteId) >= 0 ) ) {
      console.log('ACCESS DENIED', req.params.siteId, req.user.app_metadata.sites);
      return res.status(403).send('Access denied');
    }
  }
  return next();
}

// Basic auth settings for public API
exports.basicAuthCheck = function(req, res, next) {
  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return next(new UnauthorizedError('credentials_required', { message: 'No authorization token was found' }));
  };

  if (user.name ===  process.env.API_AUTH_USER && user.pass === process.env.API_AUTH_PASS) {
    return next();
  } else {
    return next(new UnauthorizedError('credentials_required', { message: 'No authorization token was found' }));
  };
};

// Get url for proxied helpers site
exports.helpersProxyUrl = function(req, site, endpoint, payload) {
  var prefix = endpoint.indexOf('menu') == -1 ? '/helpers-json/helpers/v2/' : '/helpers-json/helpers-api-menus/v2/';
  site.url = process.env.DEVEL_MODE == 1 ? 'http://localhost:8080' : site.url;
  var url = site.url + prefix + endpoint;
  console.log('helpers PROXY ' + url);
  var data = {
    url : url,
    headers : {
      "Authorization" : req.headers.authorization
    }
  }
  if (payload != undefined) {
    data.form = payload;
  }
  return data;
}

// Make a proxy request to wordpress
exports.helpersProxy = function(site, endpoint, data, callback, method) {
  request({
    url: helpers.helpersProxyUrl(req, site, endpoint),
    method: method != undefined ? method : 'GET',
    json: true,   // <--Very important!!!
    body: data
  }, callback);
};


// Apply common changes to make the compatible with Wordpress.com's API
exports.helpersRewrite = function(entity) {
  entity.ID = entity._id;
  if (entity.url) {
    entity.URL = entity.url;
  }
  return entity;
}


// Apply common changes to make the compatible with Wordpress.com's API
exports.helpersRewriteMult = function(entities) {
  entities.forEach(function(entity, i) {
    entities[i] = helpers.helpersRewrite(entity);
  });
  return entities;
}

// Get the application key from a Site
exports.siteApplication = function(site) {
  return site.stack.application.platform.toLowerCase();
}

// Find a site by id (or url)
exports.findSite = function(req, callback) {
  var query = {};//{userId: req.user._id};
  if (req.params.site_id.search(/\.|\:/) !== -1) {
    query.$or = [{url: 'http://'+req.params.site_id}, {url: 'https://'+req.params.site_id}];
  }
  else {
    query._id = req.params.site_id;
  }
  Site.findOne(query, function(err, site) {
    if (req.user == undefined || site == undefined || site._id == undefined || !site._id) {
      return callback(err, site);
    }
    User.findOne({sub: req.user.sub, 'sites': { $elemMatch: {siteId: site._id} } }, function(err1, user) {
      if (user._id != undefined) {
        site.user = user;
        return callback(err, site)
      } 
      else {
        return callback(err1, false);
      }
    });
  });
  
}


// Endpoint /site/{siteId}/posts for GET
// @todo: this is only temp, delete
exports.sendMailTest = function(req, res) {
  console.log(req.body);
  var out = helpers.sendMail(req.body.to, req.body.template, req.body);
  out = req.body;
  res.helpersEnvelope(out);
}

// Send emails
exports.sendMail = function(to, template, params) {
  var templates = {
    'invite-new': {
      html: '<p>@name has invited you to edit @sitename. As a @role you will be able to @permissions.</p>',
      subject: 'You have been invited to @sitename'
    }
  };

  var msg = templates[template];
  msg.to = to;
  msg.from = process.env.FROM_EMAIL;

  // Replace params
  for(var key in params){
    msg.html = msg.html.replace('@'+key, params[key]);
    msg.subject = msg.subject.replace('@'+key, params[key]);
  }

  // Get text version
  msg.text = htmlToText.fromString(msg.html, {
    wordwrap: 130
  });

  // Send email with ses-transporter
  var transporter = nodemailer.createTransport(ses({
    accessKeyId: process.env.AMAZON_SES_KEY,
    secretAccessKey: process.env.AMAZON_SES_SECRET,
    region: process.env.AMAZON_SES_REGION
  }));

  transporter.helpers.sendMail(msg, function(error, info){
    if(error){
      console.log('ERROR SENDING EMAIL');
      return console.log(error);
    }
    console.log('EMAIL SENT' + info.response);
  });

}


// Extract username from email. From http://stackoverflow.com/questions/7266608/how-can-i-extract-the-user-name-from-an-email-address-using-javascript.
exports.extractUsername = function(email) {
  return email.match(/^([^@]*)@/)[1];
}