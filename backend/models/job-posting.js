const mongoose = require('mongoose');

//schema for job posting fetched by scraper scripts
//in use in current prod
const JobPostingSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String },
  salaryRaw: { type: String },
  applyLink: { type: String, required: true, unique: true }, // unique prevents saving the same job twice
  scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobPosting', JobPostingSchema);