// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var PluginSchema = new mongoose.Schema({
  platform: String,
  name: String,
  fetched: Date,
  application: String,
  latest_version: String,
  version: String,
  type: String,
  release_date: String,
  changelog_url: String,
  vulnerabilities: Array,
  phone: String,
  responsibility: String,
  lastConfirmed: String,
  sub: String
});

// Export the Mongoose model
module.exports = mongoose.model('Plugin', PluginSchema);
