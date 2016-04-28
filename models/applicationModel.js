// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var ApplicationSchema = new mongoose.Schema({
  name: String,
  label: String,
  version: String,
  release_date: String,
  rss_security: String
});

// Export the Mongoose model
module.exports = mongoose.model('Application', ApplicationSchema);
