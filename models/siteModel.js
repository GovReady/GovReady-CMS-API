// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var SiteSchema   = new mongoose.Schema({
  userId: String,
  name: String,
  slug: String,
  description: String,
  type: String,
  url: String,
  lang: String,
  icon: Object,
  logo: String,
  wordpress: Object,
  location: Object,
  location: Object,
  siteOptions: Object,
  updates: Object,
  meta: Object,
  plan: Object
});

// Export the Mongoose model
module.exports = mongoose.model('Site', SiteSchema);