const https = require('https');
const crypto = require('crypto');
const JobPosting = require('../models/job-posting');


const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

const scrapeUberJobs = async () => {
    try {
        let page = 0;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;

        console.log(` Initiating Uber Stealth Scraper...`);

        while (hasMore) {
            const url = 'https://www.uber.com/api/loadSearchJobsResults?localeCode=en';
            
            const payload = {
                "limit": 100, 
                "page": page,
                "params": {
                    "department": ["Engineering"],
                    "lineOfBusinessName": [],
                    "location": [
                        {"country": "IND", "region": "Karnātaka", "city": "Bangalore"},
                        {"country": "IND", "region": "Telangāna", "city": "Hyderabad"},
                        {"country": "IND", "region": "Mahārāshtra", "city": "Mumbai"}
                    ],
                    "programAndPlatform": [],
                    "team": ["Engineering"]
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'origin': 'https://www.uber.com',
                    'referer': 'https://www.uber.com/in/en/careers/list/?department=Engineering&team=Engineering',
                    'x-csrf-token': 'x', 
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(payload),
                agent: cloudflareBypassAgent
            });

            if (!response.ok) {
                console.error(` Uber API rejected request with status: ${response.status}`);
                break;
            }

            const jsonResponse = await response.json();
            //console.log(jsonResponse.data.results);
            
            const jobs = jsonResponse.data?.results || [];

            if (jobs.length === 0) {
                hasMore = false;
                break;
            }

            totalJobsFound += jobs.length;

            for (const job of jobs) {
                const title = (job.title || '').toLowerCase();
                const locationObj = job.location || {};
                const locationStr = `${locationObj.city || ''}, ${locationObj.country || ''}`.toLowerCase();

                const isEngineering = 
                    title.includes('software') || 
                    title.includes('engineer') || 
                    title.includes('developer') || 
                    title.includes('sde') || 
                    title.includes('data');

                const isTooSenior = 
                    title.includes('manager') || 
                    title.includes('director') || 
                    title.includes('vp') || 
                    title.includes('vice president') || 
                    title.includes('principal') ||
                    title.includes('head');

                const isIndia = locationStr.includes('ind') || locationStr.includes('bangalore') || locationStr.includes('hyderabad');

                if (isEngineering && isIndia && !isTooSenior) {
                    const jobUrl = `https://www.uber.com/global/en/careers/list/${job.id}`;
                    
                    const exists = await JobPosting.findOne({ portalLink: jobUrl });
                    
                    if (!exists) {
                        await JobPosting.create({
                            companyName: 'Uber',
                            role: job.title || 'Software Engineer',
                            location: `${locationObj.city || 'India'}, ${locationObj.region || ''}`,
                            salary: 'Competitive', 
                            applyLink: jobUrl,
                            postedDate: job.creationDate ? new Date(job.creationDate) : new Date() 
                        });
                        jobsAdded++;
                    }
                }
            }
            
            if (jobs.length < 100) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} total India tech postings for Uber.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Uber.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Uber right now.`);
        }

    } catch (error) {
        console.error(" Uber Scraper Error:", error.message);
    }
};

// scrapeUberJobs();
module.exports = scrapeUberJobs;