const axios = require('axios');
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
        console.log("Initiating UBS Kenexa Targeted API Scraper...");
        
        let jobsAdded = 0;
        let totalJobsFound = 0;
        let pageNumber = 1;
        let hasMore = true;

        const initUrl = 'https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?partnerid=25008&siteid=5012';
        
        const initResponse = await axios.get(initUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            httpsAgent: cloudflareBypassAgent
        });

        const rawCookies = initResponse.headers['set-cookie'] || [];
        const sessionCookies = rawCookies.map(c => c.split(';')[0]);
        const cookieString = sessionCookies.join('; ');

        
        const apiUrl = "https://jobs.ubs.com/TGnewUI/Search/api/search/getsearchresults?partnerid=25008&siteid=5012";

        while (hasMore) {
            const payload = {
                "partnerId": "25008",
                "siteId": "5012",
                "keyword": "Software Engineer", 
                "location": "India",            
                "keywordName": "",
                "locationName": "",
                "searchType": "0",
                "linkId": "0",
                "pageNumber": pageNumber,
                "pageSize": 50
            };

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/json',
                    'Origin': 'https://jobs.ubs.com',
                    'Referer': 'https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?partnerid=25008&siteid=5012',
                    'Cookie': cookieString,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                httpsAgent: cloudflareBypassAgent
            });

            const jobs = response.data.GetSearchResultWithSelectedFacets?.JobSearchResult?.JobPostings || [];
            
            if (jobs.length === 0) {
                hasMore = false;
                break;
            }

            totalJobsFound += jobs.length;

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

                    const exists = await JobPosting.findOne({ applyLink: jobUrl });

                    if (!exists) {
                        try {
                            await JobPosting.create({
                                companyName: 'UBS',
                                role: job.Title || 'Software Engineer',
                                location: job.Location || 'India',
                                salaryRaw: 'Competitive',
                                applyLink: jobUrl,
                                scrapedAt: job.PostedDate ? new Date(job.PostedDate) : new Date()
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
            
            if (jobs.length < 50) {
                hasMore = false;
            } else {
                pageNumber++;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} targeted tech jobs from UBS API.`);
        
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