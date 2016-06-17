// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

// Define our beer schema
var ContactSchema = new mongoose.Schema({
  siteId: String,
  name: String,
  department: String,
  title: String,
  email: String,
  phone: String,
  responsibility: String,
  lastConfirmed: String,
  sub: String
});

ContactSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY });

// Export the Mongoose model
module.exports = mongoose.model('Contact', ContactSchema);
