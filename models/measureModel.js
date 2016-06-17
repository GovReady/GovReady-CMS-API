// Load required packages
var mongoose = require('mongoose'),
  encrypt = require('mongoose-encryption'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// Define our beer schema
var MeasureSchema = new mongoose.Schema({
  siteId: ObjectId,
  title: String,
  process: String,
  frequency: Number,
  datetime: Date, // lastValidated
  body: String,
  due: Date,
});

MeasureSchema.plugin(encrypt, { encryptionKey: process.env.DB_ENC_KEY, signingKey: process.env.DB_SIG_KEY });

// Export the Mongoose model
module.exports = mongoose.model('Measure', MeasureSchema);
