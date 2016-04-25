// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var ContactSchema   = new mongoose.Schema({
  siteId: String,
  name: String,
  department: String,
  title: String,
  email: String,
  phone: String,
  responsiblity: String,
  lastConfirmed: String,
  sub: String
});

// Export the Mongoose model
module.exports = mongoose.model('Contact', ContactSchema);
