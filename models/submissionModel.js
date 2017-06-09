// Load required packages
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');

// Load required packages
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// Define our beer schema
var SubmissionSchema = new mongoose.Schema({
  siteId: ObjectId, 
  measureId: ObjectId,
  userId: ObjectId,
  name: String, // Name of completer
  datetime: Date,
  body: String,
  data: Object,
  title: String // Title of measure
});

SubmissionSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY, excludeFromEncryption: ['siteId', 'measureId'] });

// Export the Mongoose model
module.exports = mongoose.model('Submission', SubmissionSchema);
