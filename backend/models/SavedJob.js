const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String, required: true },
  position: { type: String, required: true },
  company: { type: String, required: true },
  url: { type: String },
  savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SavedJob', savedJobSchema);