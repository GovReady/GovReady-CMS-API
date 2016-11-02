// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

// Define our beer schema
var SiteSchema   = new mongoose.Schema({
  userId: String,
  name: String,
  application: String,
  otherApplication: String,
  slug: String,
  description: String,
  type: String,
  url: String,
  lang: String,
  icon: Object,
  logo: String,
  plugins: Object,
  accounts: Object,
  stack: Object,
  domain: Object,
  wappalyzer: Object,
  status: Object,
  mode: String // automatic || manual || local
});

SiteSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY });

// Export the Mongoose model
module.exports = mongoose.model('Site', SiteSchema);
