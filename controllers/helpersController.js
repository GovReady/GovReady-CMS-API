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

var rsmq = new RedisSMQ( {host: process.env.RABBITMQ_SERVER, port: process.env.RABBITMQ_PORT, ns: "rsmq"} );

// Check jwt tokens in `res`
exports.jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

// Get url for proxied helpers site
exports.helpersProxyUrl = function(req, site, endpoint, payload) {console.log(site.url);
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

/*http.ServerResponse.prototype.helpersEnvelope = function(obj, status){
  status = status != undefined ? status : 200;
  if (this.req.query.http_envelope == undefined) {
    return this.status(status).json(obj);
  }
  else {
    var out = {
      body: obj,
      code: status,
      headers: [{name: "Content-Type", value: "application/json"}]
    }
    var body = JSON.stringify(out);
    // content-type
    this.get('Content-Type') || this.set('Content-Type', 'application/json');

    return this.send(body);
  }
};*/



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