// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

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

PluginSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY, encryptedFields: [] });

// Export the Mongoose model
module.exports = mongoose.model('Plugin', PluginSchema);
