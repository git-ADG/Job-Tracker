const axios = require('axios');
//const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

//const MONGO_URI = process.env.MONGO_URI;

const scrapeAppleJobs = async () => {
    console.log("Initiating POST request to Apple Jobs API...");

    try {
        const apiUrl = 'https://jobs.apple.com/api/role/search';

        const searchPayload = {
            query: "Software Engineer",
            filters: {
                locations: {
                    location: ["IND"]
                }
            },
            page: 1,
            sort: "newest"
        };

        const response = await axios.post(apiUrl, searchPayload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
                'Referer': 'https://jobs.apple.com/en-in/search?search=Software%20Engineer&sort=newest&location=india-IND'
            }
        });

        const jobsData = response.data.searchResults;

        if (!jobsData || jobsData.length === 0) {
            console.log("[-] No jobs found or Apple blocked the request.");
            return;
        }

        const formattedJobs = jobsData.map(job => {
            const locationName = job.locations && job.locations[0] ? job.locations[0].name : "India";
            
            return {
                companyName: "Apple",
                role: String(job.postingTitle || "Unknown Role"),
                location: String(locationName),
                applyLink: `https://jobs.apple.com/en-in/details/${job.positionId}`,
                salaryRaw: "N/A" 
            };
        });

        console.log(`[+] Found ${formattedJobs.length} pristine Apple jobs. Connecting to Database...`);

        //await mongoose.connect(MONGO_URI);
        
        let addedCount = 0;
        for (const job of formattedJobs) {
            const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
            if (!existingJob) {
                await JobPosting.create(job);
                addedCount++;
            }
        }

        console.log(`🎉 Success! Inserted ${addedCount} brand new Apple jobs into your database.`);

    } catch (error) {
        console.error("❌ Apple Request Failed:", error.message);
    }
};

module.exports = scrapeAppleJobs;