const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

const MONGO_URI = process.env.MONGO_URI 
    ? process.env.MONGO_URI.toLowerCase() 
    : 'mongodb://127.0.0.1:27017/jobtracker';

const greenhouseCompanies = ['stripe', 'discord', 'airbnb', 'twilio', 'pinterest', 'figma', 'atlassian', 'razorpay', 'swiggy', 'cred', 'zepto', 'postman', 'vercel', 'notion', 'github'];

const scrapeGreenhouseJobs = async () => {
    console.log(`Initiating sweep across ${greenhouseCompanies.length} Greenhouse boards...`);
    await mongoose.connect(MONGO_URI);

    let totalAdded = 0;

    for (const company of greenhouseCompanies) {
        try {
            console.log(`\n🔍 Checking ${company.toUpperCase()}...`);
            const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.log(`[-] ${company} API returned ${response.status}. Skipping.`);
                continue; 
            }

            const data = await response.json();
            const jobsData = data.jobs;

            if (!jobsData || jobsData.length === 0) {
                console.log(`[-] No jobs found on ${company}.`);
                continue;
            }

            const techJobs = jobsData.filter(job => {
                const title = job.title.toLowerCase();
                const location = job.location?.name?.toLowerCase() || '';
                
                const isEngineer = title.includes('engineer') || title.includes('developer');
                
                // THE FIX: Only pass if the location explicitly mentions India or a major tech hub.
                // This handles "Remote - India", "Bengaluru", and "India" while blocking "Remote - US".
                const isIndia = location.includes('india') || 
                                location.includes('bengaluru') || 
                                location.includes('bangalore') || 
                                location.includes('hyderabad') || 
                                location.includes('pune') ||
                                location.includes('noida') ||
                                location.includes('gurugram');
                
                return isEngineer && isIndia;
            });

            if (techJobs.length === 0) {
                console.log(`[-] Found jobs for ${company}, but none matched the India Engineering filter.`);
                continue;
            }

            const formattedJobs = techJobs.map(job => ({
                companyName: company.charAt(0).toUpperCase() + company.slice(1),
                role: String(job.title),
                location: String(job.location.name),
                applyLink: String(job.absolute_url),
                salaryRaw: "N/A" 
            }));

            let addedCount = 0;
            for (const job of formattedJobs) {
                const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
                if (!existingJob) {
                    await JobPosting.create(job);
                    addedCount++;
                    totalAdded++;
                }
            }

            console.log(`[+] Added ${addedCount} new jobs for ${company}.`);

        } catch (error) {
            console.error(`❌ Failed to process ${company}:`, error.message);
        }
    }

    console.log(`\n🎉 Greenhouse Sweep Complete! Inserted ${totalAdded} brand new jobs across all boards.`);
    
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

module.exports = scrapeGreenhouseJobs;