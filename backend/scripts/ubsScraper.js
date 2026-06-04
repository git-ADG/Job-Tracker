// const fetch = require('node-fetch');
const https = require('https');
const crypto = require('crypto');
const JobPosting = require('../models/job-posting');


const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

const scrapeUbsJobs = async () => {
    try {
        console.log("Initiating UBS Kenexa Session-Bypass Scraper...");
        
        const initResponse = await fetch('https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?partnerid=25008&siteid=5012', {
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            agent: cloudflareBypassAgent 
        });

        const rawCookies = typeof initResponse.headers.getSetCookie === 'function' 
            ? initResponse.headers.getSetCookie() 
            : [initResponse.headers.get('set-cookie')].filter(Boolean);
            
        const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');

        const url = "https://jobs.ubs.com/TGnewUI/Search/api/search/getsearchresults?partnerid=25008&siteid=5012";
        
        const payload = {
            "partnerId": "25008",
            "siteId": "5012",
            "keyword": "Software Engineer",
            "location": "India",
            "keywordName": "",
            "locationName": "",
            "searchType": "0",
            "linkId": "0",
            "pageNumber": 1,
            "pageSize": 50
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/json',
                'Origin': 'https://jobs.ubs.com',
                'Referer': 'https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?partnerid=25008&siteid=5012',
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify(payload),
            agent: cloudflareBypassAgent 
        });

        if (!response.ok) {
            console.error(`UBS API rejected with status: ${response.status}`);
            return;
        }

        const jsonResponse = await response.json();
        const jobs = jsonResponse.GetSearchResultWithSelectedFacets?.JobSearchResult?.JobPostings || [];
        let jobsAdded = 0;

        console.log(`[+] Downloaded ${jobs.length} raw results from UBS... filtering...`);

        for (const job of jobs) {
            const title = (job.Title || '').toLowerCase();
            const rawJobString = JSON.stringify(job).toLowerCase();

            const isEngineering = 
                title.includes('software') || 
                title.includes('engineer') || 
                title.includes('developer') || 
                title.includes('sde') || 
                title.includes('data');

            const isIndia = rawJobString.includes('india') || rawJobString.includes('pune') || rawJobString.includes('mumbai');

            if (isEngineering && isIndia) {
                const jobId = job.Id;
                const jobUrl = `https://jobs.ubs.com/TGnewUI/Search/home/VacancyViews/VacancyDetails?partnerid=25008&siteid=5012&jobId=${jobId}`;

                const exists = await JobPosting.findOne({ portalLink: jobUrl });

                if (!exists) {
                    await JobPosting.create({
                        companyName: 'UBS',
                        role: job.Title || 'Software Engineer',
                        location: job.Location || 'India',
                        salary: 'Competitive',
                        applyLink: jobUrl,
                        postedDate: job.PostedDate ? new Date(job.PostedDate) : new Date()
                    });
                    jobsAdded++;
                }
                // jobsAdded++;
            }
        }

        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for UBS.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for UBS right now.`);
        }

    } catch (error) {
        console.error("UBS Scraper Error:", error.message);
    }
};

module.exports = scrapeUbsJobs;
// scrapeUbsJobs();