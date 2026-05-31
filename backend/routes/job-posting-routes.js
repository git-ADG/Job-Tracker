const express = require('express');
const router = express.Router();
const JobPosting = require('../models/job-posting.js');

router.get('/', async (req, res) => {
    try {
        const jobs = await JobPosting.find().sort({ scrapedAt: -1 });
        return res.status(200).json(jobs);
    } catch(err) {
        console.error("Database fetch error:", err);
        return res.status(500).json({ 
            error: 'Failed to fetch job postings from database', 
            details: err.message 
        });
    }
});

module.exports = router;