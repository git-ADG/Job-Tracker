const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const JobPosting = require('../models/job-posting');

const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

const scrapeDeutscheBankJobs = async () => {
    try {
        let firstItem = 1;
        const countItem = 50;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;
        
        const processedLinks = new Set();

        console.log("Initiating Deutsche Bank Avature/Beesite Scraper...");

        while (hasMore) {
            const payload = {
                LanguageCode: "en",
                SearchParameters: {
                    FirstItem: firstItem,
                    CountItem: countItem,
                    MatchedObjectDescriptor: [
                        "PositionID",
                        "PositionTitle",
                        "PositionURI",
                        "PositionLocation.CountryName",
                        "PositionLocation.CityName",
                        "PublicationStartDate"
                    ],
                    Sort: [{ Criterion: "PublicationStartDate", Direction: "DESC" }]
                },
                SearchCriteria: [] 
            };

            const encodedPayload = encodeURIComponent(JSON.stringify(payload));
            const url = `https://api-deutschebank.beesite.de/search/?data=${encodedPayload}`;

            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://careers.db.com',
                    'Referer': 'https://careers.db.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                httpsAgent: cloudflareBypassAgent
            });

            const rawItems = response.data.SearchResult?.SearchResultItems || [];

            if (rawItems.length === 0) {
                hasMore = false;
                break;
            }

            totalJobsFound += rawItems.length;

            for (const item of rawItems) {
                const job = item.MatchedObjectDescriptor || {};
                
                const title = (job.PositionTitle || '').toLowerCase();
                const rawJobString = JSON.stringify(job).toLowerCase();

                const isEngineering = 
                    title.includes('software') || 
                    title.includes('engineer') || 
                    title.includes('developer') || 
                    title.includes('sde') || 
                    title.includes('data') ||
                    rawJobString.includes('technology');

                const isTooSenior = 
                    title.includes('manager') || 
                    title.includes('director') || 
                    title.includes('vp') || 
                    title.includes('vice president') || 
                    title.includes('principal') ||
                    title.includes('head');

                
                const isIndia = 
                    rawJobString.includes('india') || 
                    rawJobString.includes('pune') || 
                    rawJobString.includes('mumbai') ||
                    rawJobString.includes('bengaluru') ||
                    rawJobString.includes('bangalore') ||
                    rawJobString.includes('chennai');

                if (isEngineering && isIndia && !isTooSenior) {
                    const jobUrl = job.PositionURI || `https://careers.db.com/professionals/search-roles/#/professional/job/${job.PositionID}`;
                    
                    if (processedLinks.has(jobUrl)) {
                        continue;
                    }
                    processedLinks.add(jobUrl);

                    const exists = await JobPosting.findOne({ applyLink: jobUrl });
                    
                    if (!exists) {
                        try {
                            // Safely extract location (Avature sometimes returns arrays for locations)
                            let locationStr = 'India';
                            if (Array.isArray(job.PositionLocation) && job.PositionLocation.length > 0) {
                                locationStr = `${job.PositionLocation[0].CityName || ''}, ${job.PositionLocation[0].CountryName || 'India'}`;
                            } else if (job.PositionLocation && !Array.isArray(job.PositionLocation)) {
                                locationStr = `${job.PositionLocation.CityName || ''}, ${job.PositionLocation.CountryName || 'India'}`;
                            }

                            await JobPosting.create({
                                companyName: 'Deutsche Bank',
                                role: job.PositionTitle || 'Software Engineer',
                                location: locationStr,
                                salaryRaw: 'Competitive', 
                                applyLink: jobUrl,
                                scrapedAt: job.PublicationStartDate ? new Date(job.PublicationStartDate) : new Date() 
                            });
                            jobsAdded++;
                        } catch (dbError) {
                            if (dbError.code !== 11000) {
                                console.error("Database Error:", dbError.message);
                            }
                        }
                    }
                    // jobsAdded++;
                }
            }
            
            // Pagination logic
            firstItem += countItem;
            if (rawItems.length < countItem) {
                hasMore = false; // Reached the last page
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} total global jobs for Deutsche Bank.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Deutsche Bank.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Deutsche Bank right now.`);
        }

    } catch (error) {
        console.error("Deutsche Bank Scraper Error:", error.message);
    }
};

module.exports = scrapeDeutscheBankJobs;
// scrapeDeutscheBankJobs();