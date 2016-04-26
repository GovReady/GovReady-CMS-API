// Load required packages
var Site = require('../models/siteModel');
var Contact = require('../models/contactModel');

var request = require('request');
var merge = require('lodash/merge');

var helpers = require('../controllers/helpersController');


/** 
 * Endpoint /sites/:siteId/contacts for GET
 */
exports.getSiteContacts = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    Contact.find( { siteId: req.params.siteId } )
    .then(function (contacts) {
      
      return res.status(200).json( contacts ); 

    });
    
  });

} // function


/** 
 * Endpoint /sites/:siteId/contacts/:contactId for GET
 */
exports.getSiteContact = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    Contact.findOne( { contactId: req.params.contactId } )
    .then(function (contact) {
      
      return res.status(200).json( contact ); 

    });
    
  });

} // function


/** 
 * Endpoint /sites/:siteId/contacts for POST
 */
exports.postSiteContact = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    var contact = new Contact(req.body);
    contact.siteId = req.params.siteId;
    console.log(contact);
    contact.save();
    return res.status(200).json( contact ); 

  });

} // function


/** 
 * Endpoint /sites/:siteId/contacts/:contactId for PATCH
 */
exports.patchSiteContact = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    Contact.findOne( { _id: req.params.contactId } )
    .then(function (contact) {

      contact = merge(contact, req.body);
      contact.save();
      return res.status(200).json( contact );

    });

  });

} // function


/** 
 * Endpoint /sites/:siteId/contacts/:contactId for DELETE
 */
exports.deleteSiteContact = function(req, res) {

  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {
    
    Contact.findOne( { contactId: req.params.contactId } )
    .then(function (contact) {
      
      contact.remove(function (err) {
        if (err) {
          return res.status(500).json( { error: err } );
        }
        else {
          return res.status(200).json( contact );
        }
      });
      
    });
    
  });

} // function