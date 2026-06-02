const axios = require('axios');
const JobPosting = require('../models/job-posting');

const scrapeMorganStanleyJobs = async () => {
    try {
        let start = 0;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;
        
        const processedLinks = new Set();

        const initResponse = await axios.get('https://morganstanley.eightfold.ai/careers', {
            headers: {
                'accept': 'text/html,application/xhtml+xml',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const csrfMatch = initResponse.data.match(/csrf-token"\s+content="([^"]+)"/) || initResponse.data.match(/"csrfToken"\s*:\s*"([^"]+)"/);
        const csrfToken = csrfMatch ? csrfMatch[1] : '';
        const sessionCookie = initResponse.headers['set-cookie'] ? initResponse.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';

        while (hasMore) {
            const url = `https://morganstanley.eightfold.ai/api/pcsx/search?domain=morganstanley.com&start=${start}&sort_by=timestamp&filter_businessarea=technology`;

            const response = await axios.get(url, {
                headers: {
                    'accept': 'application/json',
                    'x-csrf-token': csrfToken,
                    'cookie': sessionCookie,
                    'referer': 'https://morganstanley.eightfold.ai/careers',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const jobs = response.data.data?.positions || [];

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
                    title.includes('mts') || 
                    title.includes('technical staff') ||
                    title.includes('architect') ||
                    title.includes('data') ||
                    rawJobString.includes('engineering') ||
                    rawJobString.includes('technology') ||
                    rawJobString.includes('r&d');
                
                const isIndia = 
                    (rawJobString.includes('india') || 
                    rawJobString.includes('bengaluru') || 
                    rawJobString.includes('bangalore') || 
                    rawJobString.includes('mumbai') ||
                    rawJobString.includes('hyderabad') ||
                    rawJobString.includes('remote - ind'))
                    && !(rawJobString.includes('indiana'));

                if (isEngineering && isIndia) {
                    const jobUrl = job.positionUrl 
                        ? `https://morganstanley.eightfold.ai${job.positionUrl}` 
                        : `https://morganstanley.eightfold.ai/careers?pid=${job.id}`;
                    
                    if (processedLinks.has(jobUrl)) {
                        continue;
                    }
                    processedLinks.add(jobUrl);

                    const exists = await JobPosting.findOne({ portalLink: jobUrl });
                    
                    if (!exists) {
                        try {
                            await JobPosting.create({
                                companyName: 'Morgan Stanley',
                                role: job.name || 'Software Engineer',
                                location: Array.isArray(job.locations) ? job.locations.join(', ') : (job.location || 'India (Multiple)'),
                                salary: 'Competitive', 
                                applyLink: jobUrl,
                                postedDate: job.postedTs ? new Date(job.postedTs * 1000) : new Date() 
                            });
                            jobsAdded++;
                        } catch (dbError) {
                            if (dbError.code !== 11000) {
                                throw dbError;
                            }
                        }
                    }
                }
            }
            
            start += jobs.length;
        }

        console.log(`[+] Scanned ${totalJobsFound} total global technology jobs for Morgan Stanley.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Morgan Stanley.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Morgan Stanley right now.`);
        }

    } catch (error) {
        console.error("Morgan Stanley Scraper Error:", error.message);
    }
};

module.exports = scrapeMorganStanleyJobs;