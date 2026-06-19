const express = require('express');
const router = express.Router();
const JobPosting = require('../models/job-posting.js');

//for job postings fetched by scraper scripts
//in use in current prod
router.get('/', async (req, res) => {
    const redisClient = req.redisClient;
    const cacheKey = 'job_postings';
    try {
        const cachedJobs = await redisClient.get(cacheKey);
        if(cachedJobs){
            console.log("Serving data from cache");
            return res.status(200).json(JSON.parse(cachedJobs));
        }
        console.log("Cache miss, hitting DB");
        const jobs = await JobPosting.find().sort();

        await redisClient.setEx(cacheKey, 14400, JSON.stringify(jobs));
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