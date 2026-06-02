const axios = require('axios');
const JobPosting = require('../models/job-posting');

const scrapeGithubJobs = async () => {
    try {
        const url = 'https://www.github.careers/api/jobs?keywords=software%20engineer%20india&sortBy=relevance&page=1&internal=false';
        
        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const jobs = Array.isArray(response.data) ? response.data : (response.data.jobs || response.data.data || []);
        let jobsAdded = 0;

        console.log(`[+] Found ${jobs.length} total pre-filtered jobs for GitHub... verifying...`);

        for (const job of jobs) {
            const title = (job.title || '').toLowerCase();
            const rawLocation = JSON.stringify(job.location || job.locations || job.city || job.country || '').toLowerCase();
            const rawDepartment = JSON.stringify(job.team || job.department || job.category || '').toLowerCase();

            const isEngineering = 
                title.includes('software') || 
                title.includes('engineer') || 
                title.includes('developer') || 
                title.includes('sde') || 
                title.includes('mts') || 
                title.includes('technical staff') ||
                title.includes('architect') ||
                title.includes('data') ||
                rawDepartment.includes('engineering') ||
                rawDepartment.includes('r&d');
            
            const isIndia = 
                rawLocation.includes('india') || 
                rawLocation.includes('bengaluru') || 
                rawLocation.includes('bangalore') || 
                rawLocation.includes('remote - ind') ||
                rawLocation.includes('hyderabad') ||
                rawLocation.includes('pune');

            if (isEngineering && isIndia) {
                const jobUrl = job.applyUrl || job.url || `https://www.github.careers/careers-home/jobs/${job.id || job.reqId}`;
                
                const exists = await JobPosting.findOne({ portalLink: jobUrl });
                
                if (!exists) {
                    await JobPosting.create({
                        companyName: 'GitHub',
                        role: job.title,
                        location: typeof job.location === 'string' ? job.location : 'India (Multiple)',
                        salary: 'Competitive', 
                        applyLink: jobUrl,
                        postedDate: job.postedDate ? new Date(job.postedDate) : new Date() 
                    });
                    jobsAdded++;
                }
            }
        }

        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for GitHub.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for GitHub right now.`);
        }

    } catch (error) {
        console.error(" GitHub Scraper Error:", error.message);
    }
};

// scrapeGithubJobs();
module.exports = scrapeGithubJobs;