// Load required packages
var mongoose = require('mongoose'),
  encrypt = require('mongoose-encryption'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// Define our beer schema
var ScanSchema = new mongoose.Schema({
  siteId: ObjectId,
  datetime: Date,
  name: String,
  result: Number,
  data: Object,
});

ScanSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY, excludeFromEncryption: ['siteId', 'name', 'datetime'] });

// Export the Mongoose model
module.exports = mongoose.model('Scan', ScanSchema);