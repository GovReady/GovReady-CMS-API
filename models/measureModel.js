// Load required packages
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
// Define our beer schema
var MeasureSchema = new mongoose.Schema({
  siteId: ObjectId,
  title: String,
  process: String,
  frequency: Number,
  datetime: Date,
});

// Export the Mongoose model
module.exports = mongoose.model('Measure', MeasureSchema);
