// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

// Define our beer schema
var ApplicationSchema = new mongoose.Schema({
  name: String,
  label: String,
  version: String,
  release_date: String,
  rss_security: String
});

ApplicationSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY });

// Export the Mongoose model
module.exports = mongoose.model('Application', ApplicationSchema);
