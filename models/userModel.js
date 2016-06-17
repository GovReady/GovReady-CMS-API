// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

// Define our user schema
var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  validation_code: String,
  first_name: String,
  last_name: String,
  sub: String,
  sites: Array,
  location: Object,
  avatar_URL: String,
  primary_blog: String,
  URL: String,
  sub: String
});

UserSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY });


// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);