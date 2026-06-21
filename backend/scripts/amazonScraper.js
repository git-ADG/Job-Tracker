const axios = require('axios');
axios.defaults.timeout = 300000;
//const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

//const MONGO_URI = process.env.MONGO_URI;

//response is in perfect json format
//no security headaches, easy access
const scrapeAmazonJobs = async () => {
    console.log("Initiating API request to Amazon Jobs...");

    try {
        const apiUrl = 'https://www.amazon.jobs/en/search.json?offset=0&result_limit=100&sort=recent&category%5B%5D=software-development&country%5B%5D=IND';        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        const jobsData = response.data.jobs;

        // console.log(jobsData);

        if (!jobsData || jobsData.length === 0) {
            console.log("[-] No jobs found or Amazon blocked the request.");
            return;
        }

        const indiaJobs = jobsData.filter(job => {
            const country = (job.country_code || job.country || "").toUpperCase();
            const locationString = (job.location || "").toUpperCase();
            
            return country === 'IND' || country === 'IN' || locationString.includes('IND') || locationString.includes('INDIA');
        });

        if (indiaJobs.length === 0) {
            console.log("[-] Found jobs, but none matched the strict India filter.");
            return;
        }
        const formattedJobs = indiaJobs.map(job => {
            return {
                companyName: "Amazon",
                role: String(job.title || "Unknown Role"),
                location: `${job.city || 'Remote'}, ${job.country_code || 'IN'}`,
                applyLink: `https://www.amazon.jobs${job.job_path}`,
                salaryRaw: "N/A" 
            };
        });

        console.log(`[+] Strict Filter applied: Kept ${formattedJobs.length} pristine India jobs. Connecting to Database...`);

        // console.log(`[+] Found ${formattedJobs.length} pristine Amazon jobs. Connecting to Database...`);

        //await mongoose.connect(MONGO_URI);
        
        let addedCount = 0;
        for (const job of formattedJobs) {
            const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
            if (!existingJob) {
                await JobPosting.create(job);
                addedCount++;
            }
            // console.log(job);
            // addedCount++;
        }

        console.log(`Success! Inserted ${addedCount} brand new Amazon jobs into your database.`);

    } catch (error) {
        console.error("Amazon Request Failed:", error.message);
    }
};
// scrapeAmazonJobs();

module.exports = scrapeAmazonJobs;