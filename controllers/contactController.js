// Load required packages
var Site = require('../models/siteModel');
var Contact = require('../models/contactModel');

var request = require('request');
var merge = require('lodash/merge');
var yaml = require('js-yaml');
var fs = require('fs');

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
    
    Contact.findOne( { _id: req.params.contactId } )
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

    Contact.findOne( { _id: req.params.contactId } )
    .then(function (contact) {
      if (!contact) {
        return res.status(500).json( { error: 'Contact not found' } );
      }  
      contact.remove(function (err) {
        if (err) {
          return res.status(500).json( { error: err } );
        }
        else {
          return res.status(200).json( {deleted: true, _id: contact._id} );
        }
      });
      
    });
    
  });

} // function



/** 
 * Endpoint /sites/:siteId/contacts/load/:contactStack for POST
 * Note: This is just called by /sites/:siteId/demoLoad, the endpoint above does not work.
 */
exports.postSiteContactsLoad = function(req, res) {
  Site.findOne( { _id: req.params.siteId } )
  .then(function (site) {

    console.log('/../data/contacts-' + req.params.contactStack + '.yml');

    try {
      var doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../data/contacts-' + req.params.contactStack + '.yml', 'utf8'));

      console.log(doc);

      var contacts = [];
      doc.forEach(function(item, i) {
      
        // Set some values
        item.siteId = req.params.siteId;

        // Create monogo Contact
        var contact = new Contact(item);
        contact.save();
        contacts.push(contact);

      }); // forEach

      if (res != undefined) {
        return res.status(200).json(contacts);
      }
      console.log('Imported '+contacts.length+' contacts');
      return contacts;

    } catch (e) {
      return res.status(500).json({ err: 'Contact stack '+ req.params.contactStack +' not found.' });
    }

    //return res.status(200).json(measure);  
  });
  //return res.status(500).json({ err: 'No site found' });  

} // function