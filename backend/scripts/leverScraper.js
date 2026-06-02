const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

//const MONGO_URI = process.env.MONGO_URI;

//not all working need to check the paths
const leverCompanies = ['stripe', 'discord', 'airbnb', 'twilio', 'pinterest', 'figma', 'razorpaysoftwareprivatelimited', 'swiggy', 'cred', 'zepto', 'postman', 'vercel', 'notion'];

//clean json formatted data
const scrapeLeverJobs = async () => {
    console.log(`Initiating sweep across ${leverCompanies.length} Lever boards...`);
    //await mongoose.connect(MONGO_URI);

    let totalAdded = 0;

    for (const company of leverCompanies) {
        try {
            console.log(`\n🔍 Checking ${company.toUpperCase()}...`);
    
            const apiUrl = `https://api.lever.co/v0/postings/${company}?mode=json`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.log(`[-] ${company} API returned ${response.status}. Tenant ID might differ. Skipping.`);
                continue;
            }


            const jobsData = await response.json();

            if (!jobsData || jobsData.length === 0) {
                console.log(`[-] No jobs found on ${company}.`);
                continue;
            }

        
            const techJobs = jobsData.filter(job => {
                const title = (job.text || '').toLowerCase();
                const location = (job.categories?.location || '').toLowerCase();
                
                const isEngineer = title.includes('engineer') || title.includes('developer');
                const isIndia = location.includes('india') || 
                                location.includes('bengaluru') || 
                                location.includes('bangalore') || 
                                location.includes('hyderabad') || 
                                location.includes('mumbai') ||
                                location.includes('pune') ||
                                location.includes('noida') ||
                                location.includes('gurugram') ||
                                location.includes('gurgaon');
                
                return isEngineer && isIndia;
            });

            if (techJobs.length === 0) {
                console.log(`[-] Found jobs for ${company}, but none matched the India Engineering filter.`);
                continue;
            }

            const formattedJobs = techJobs.map(job => ({
                companyName: company.charAt(0).toUpperCase() + company.slice(1),
                role: String(job.text),
                location: String(job.categories?.location || 'India'),
                applyLink: String(job.hostedUrl), 
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
            console.error(`Failed to process ${company}:`, error.message);
        }
    }

    console.log(`\nLever Sweep Complete! Inserted ${totalAdded} brand new jobs across all boards.`);
};

module.exports = scrapeLeverJobs;