const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  url: { type: String },
  status: { type: String, default: 'Applied' },
  notes: { type: String, default: '' },
  interviewDate: { type: Date, default: null },
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Application', applicationSchema);