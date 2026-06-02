const axios = require('axios');
const JobPosting = require('../models/job-posting');

//medium security, took time to locate the api
//perfectly formatted json response
const scrapeAtlassianJobs = async () => {
    try {
        const response = await axios.get('https://www.atlassian.com/endpoint/careers/listings', {
            headers: {
                'accept': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const jobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);
        let jobsAdded = 0;

        console.log(`[+] Found ${jobs.length} total global jobs for Atlassian... filtering...`);

        for (const job of jobs) {
            const title = (job.title || '').toLowerCase();
            const rawLocation = JSON.stringify(job.location || job.locations || '').toLowerCase();
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
                rawLocation.includes('remote - ind');

            if (isEngineering && isIndia) {
                const jobUrl = job.applyUrl || `https://www.atlassian.com/company/careers/detail/${job.id}`;
                const exists = await JobPosting.findOne({ portalLink: jobUrl });
                
                if (!exists) {
                    await JobPosting.create({
                        companyName: 'Atlassian',
                        role: job.title,
                        location: Array.isArray(job.locations) ? job.locations.join(', ') : (job.location || 'India (Multiple)'),
                        salaryRaw: 'Competitive', 
                        applyLink: jobUrl,
                        scrapedAt: new Date()
                    });
                    jobsAdded++;
                }
            }
        }

        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Atlassian.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Atlassian right now.`);
        }

    } catch (error) {
        console.error("Atlassian Scraper Error:", error.message);
    }
};

module.exports = scrapeAtlassianJobs;