const axios = require('axios');
const JobPosting = require('../models/job-posting');

const scrapeHsbcJobs = async () => {
    try {
        let start = 0;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;
        
        const processedLinks = new Set();

        console.log("Initiating HSBC Eightfold Targeted Scraper...");

        while (hasMore) {
            const url = `https://portal.careers.hsbc.com/api/apply/v2/jobs?domain=hsbc.com&query=Software%20Engineering&location=India&start=${start}&num=50`;

            const response = await axios.get(url, {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'referer': 'https://portal.careers.hsbc.com/careers?domain=hsbc.com',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const jobs = response.data.positions || [];

            if (jobs.length === 0) {
                hasMore = false;
                break;
            }

            totalJobsFound += jobs.length;

            for (const job of jobs) {
                const title = (job.name || '').toLowerCase();
                const rawJobString = JSON.stringify(job).toLowerCase();

                const isEngineering = 
                    title.includes('software') || 
                    title.includes('engineer') || 
                    title.includes('developer') || 
                    title.includes('sde') || 
                    title.includes('architect') ||
                    title.includes('data') ||
                    rawJobString.includes('engineering') ||
                    rawJobString.includes('technology');
                
                const isIndia = 
                    (rawJobString.includes('india') || 
                    rawJobString.includes('bengaluru') || 
                    rawJobString.includes('bangalore') || 
                    rawJobString.includes('mumbai') ||
                    rawJobString.includes('hyderabad') ||
                    rawJobString.includes('pune') ||
                    rawJobString.includes('chennai')) &&
                    !(rawJobString.includes('indiana'));

                if (isEngineering && isIndia) {
                    const jobUrl = job.canonicalPositionUrl || `https://portal.careers.hsbc.com/careers/job/${job.id}`;
                    
                    if (processedLinks.has(jobUrl)) {
                        continue;
                    }
                    processedLinks.add(jobUrl);

                    const exists = await JobPosting.findOne({ applyLink: jobUrl });
                    
                    if (!exists) {
                        try {
                            await JobPosting.create({
                                companyName: 'HSBC',
                                role: job.name || 'Software Engineer',
                                location: job.location || 'India',
                                salaryRaw: 'Competitive', 
                                applyLink: jobUrl,
                                scrapedAt: job.postedTs ? new Date(job.postedTs * 1000) : new Date() 
                            });
                            jobsAdded++;
                        } catch (dbError) {
                            if (dbError.code !== 11000) {
                                throw dbError;
                            }
                        }
                    }
                    // jobsAdded++;
                }
            }
            
            start += jobs.length;
            
            if (jobs.length < 50) {
                hasMore = false;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} targeted tech jobs for HSBC.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for HSBC.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for HSBC right now.`);
        }

    } catch (error) {
        console.error("HSBC Scraper Error:", error.message);
    }
};

module.exports = scrapeHsbcJobs;
// scrapeHsbcJobs();