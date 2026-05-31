const mongoose = require('mongoose');

const JobPostingSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String }, // For filtering by India/Remote
  salaryRaw: { type: String }, // To parse that >10 LPA requirement
  applyLink: { type: String, required: true, unique: true }, // 'unique' prevents saving the same job twice
  scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobPosting', JobPostingSchema);