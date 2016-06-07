// Load required packages
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

// Define our beer schema
var SubmissionSchema = new mongoose.Schema({
  siteId: ObjectId,
  measureId: ObjectId,
  userId: ObjectId,
  name: String,
  datetime: Date,
  body: String,
  data: Object
});

// Export the Mongoose model
module.exports = mongoose.model('Submission', SubmissionSchema);
