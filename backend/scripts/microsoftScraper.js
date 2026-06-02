const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

const MONGO_URI = process.env.MONGO_URI;

//heavy security
//not working, needs fixing
const scrapeMicrosoftJobs = async () => {
    console.log("Initiating native fetch request to Microsoft Careers API...");

    try {
        const apiUrl = 'https://gcsservices.careers.microsoft.com/search/api/v1/search?q=Software%20Engineer&lc=India&pg=1&pgSz=50&o=Recent';
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const jobsData = data?.operationResult?.result?.jobs;

        if (!jobsData || jobsData.length === 0) {
            console.log("[-] No jobs found from Microsoft search query.");
            return;
        }

        const formattedJobs = jobsData.map(job => {
            return {
                companyName: "Microsoft",
                role: String(job.title || "Unknown Role"),
                location: String(job.properties?.locations?.[0] || "India"),
                applyLink: `https://jobs.careers.microsoft.com/global/en/job/${job.jobId}`,
                salaryRaw: "N/A" 
            };
        });

        console.log(`[+] Found ${formattedJobs.length} pristine Microsoft jobs. Connecting to Database...`);

        //await mongoose.connect(MONGO_URI);
        
        let addedCount = 0;
        for (const job of formattedJobs) {
            const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
            if (!existingJob) {
                await JobPosting.create(job);
                addedCount++;
            }
        }

        console.log(`Success! Inserted ${addedCount} brand new Microsoft jobs into your database.`);

    } catch (error) {
        console.error("Microsoft Request Failed:", error.message);
    }
};

module.exports = scrapeMicrosoftJobs;