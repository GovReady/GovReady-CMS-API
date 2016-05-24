var express = require('express');
var passport = require('passport');
var router = express.Router();

var helpers = require('../controllers/helpersController');
var govreadyController = require('../controllers/govreadyController');
var userController = require('../controllers/userController');
var siteController = require('../controllers/siteController');
var pluginController = require('../controllers/pluginController');
var measureController = require('../controllers/measureController');
var contactController = require('../controllers/contactController');
var applicationController = require('../controllers/applicationController');
var monitorController = require('../controllers/monitorController');


/*
var env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  URL: process.env.URL || 'http://localhost:4000/'
}
*/


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', env: env });
})

router.route('/initialize')
  .post(userController.postInitialize);

router.route('/refresh-token')
  .post(userController.postRefreshToken);

router.route('/users')
  .post(helpers.jwtCheck, userController.postUser);
/*
router.route('/users/:userId')
  .get(helpers.jwtCheck, userController.getUser)
  .put(helpers.jwtCheck, userController.putUser)
  .delete(helpers.jwtCheck, userController.deleteUser);


router.route('/sites')
  .post(helpers.jwtCheck, siteController.postSite);

router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  .put(helpers.jwtCheck, siteController.putSite)
  .delete(helpers.jwtCheck, siteController.deleteSite);
*/

router.route('/sites/:siteId')
  .get(helpers.jwtCheck, siteController.getSite)
  //.put(helpers.jwtCheck, siteController.putSite)
  //.delete(helpers.jwtCheck, siteController.deleteSite);

router.route('/sites/:siteId/collect')
  .post(helpers.jwtCheck, siteController.postSiteCollect)
  //.put(helpers.jwtCheck, siteController.putSite)
  //.delete(helpers.jwtCheck, siteController.deleteSite);

router.route('/sites/:siteId/plugins')
  .post(helpers.jwtCheck, siteController.postSitePlugins)
  .get(helpers.jwtCheck, siteController.getSitePlugins)

router.route('/sites/:siteId/accounts')
  .post(helpers.jwtCheck, siteController.postSiteAccounts)
  .get(helpers.jwtCheck, siteController.getSiteAccounts)

router.route('/sites/:siteId/stack')
  .get(helpers.jwtCheck, siteController.getSiteStack)
  .post(helpers.jwtCheck, siteController.postSiteStack);
  //.post(helpers.jwtCheck, siteController.postSiteCollect)
  //.put(helpers.jwtCheck, siteController.putSite)
  //.delete(helpers.jwtCheck, siteController.deleteSite);

router.route('/sites/:siteId/domain')
  .get(helpers.jwtCheck, siteController.getSiteDomain)

router.route('/sites/:siteId/status')
  .get(helpers.jwtCheck, siteController.getSiteStatus)

router.route('/sites/:siteId/recommended')
  .get(helpers.jwtCheck, siteController.getSiteRecommended)

router.route('/sites/:siteId/changeMode')
  .post(helpers.jwtCheck, siteController.postSiteChangeMode)


// Contacts
router.route('/sites/:siteId/contacts')
  .get(helpers.jwtCheck, contactController.getSiteContacts)
  .post(helpers.jwtCheck, contactController.postSiteContact)

router.route('/sites/:siteId/contacts/:contactId')
  .get(helpers.jwtCheck, contactController.getSiteContact)
  .patch(helpers.jwtCheck, contactController.patchSiteContact)
  .delete(helpers.jwtCheck, contactController.deleteSiteContact)


// Measures
router.route('/sites/:siteId/measures')
  .get(helpers.jwtCheck, measureController.getSiteMeasures)
  .post(helpers.jwtCheck, measureController.postSiteMeasure)


// Plugins
router.route('/plugins')
  .get(pluginController.getPlugins)

router.route('/sites/:siteId/vulnerabilities')
  .get(helpers.jwtCheck, pluginController.getSiteVulnerabilities)


// Applications
// @todo: these are all 404ing currently
router.route('/applications')
  .post(applicationController.postApplication)
  .get(applicationController.getApplications);

router.route('/applications/:application')
  .get(applicationController.getApplication);

router.route('/applications/:app/news')
  .get(applicationController.getApplicationNews);


// Monitors
router.route('/monitor/:siteId/:callback')
  .post(monitorController.getMonitor)
  .get(monitorController.getMonitor)



module.exports = router;
