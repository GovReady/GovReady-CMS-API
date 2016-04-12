// Load required packages
var mongoose = require('mongoose');

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


// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);