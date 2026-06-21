const axios = require('axios');
axios.defaults.timeout = 300000;
const https = require('https');
const crypto = require('crypto');
const cheerio = require('cheerio'); // Added Cheerio
const JobPosting = require('../models/job-posting');

const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

const scrapeCitiJobs = async () => {
    try {
        let currentPage = 1;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;
        
        const processedLinks = new Set();

        console.log("Initiating Citi Phenom People Targeted Scraper...");

        while (hasMore) {
            const url = `https://jobs.citi.com/search-jobs/results?ActiveFacetID=0&CurrentPage=${currentPage}&RecordsPerPage=15&Keywords=software+engineer&Location=India&ShowRadius=False&IsPagination=True&SearchResultsModuleName=Search+Results&SearchType=1&LocationType=2&OrganizationIds=287&ResultsType=0`;

            const response = await axios.get(url, {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://jobs.citi.com/search-jobs/software%20engineer/India/287/1/2/1269750/22/79/50/2',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                httpsAgent: cloudflareBypassAgent
            });

            const htmlContent = response.data.results || '';

            if (!htmlContent || htmlContent.trim() === '') {
                hasMore = false;
                break;
            }

            const $ = cheerio.load(htmlContent);
            let currentBatchCount = 0;

            $('.sr-job-item').each(async (index, element) => {
                currentBatchCount++;
                totalJobsFound++;

                const relativeUrl = $(element).find('.sr-job-item__link').attr('href') || '';
                const title = $(element).find('.sr-job-item__link').text().trim();
                const location = $(element).find('.sr-job-location').text().trim();

                if (!relativeUrl || !title) return; 

                const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://jobs.citi.com${relativeUrl}`;
                const titleLower = title.toLowerCase();
                const locationLower = location.toLowerCase();

                const isEngineering = 
                    titleLower.includes('software') || 
                    titleLower.includes('engineer') || 
                    titleLower.includes('developer') || 
                    titleLower.includes('data');

                const isTooSenior = 
                    titleLower.includes('lead') || 
                    titleLower.includes('manager') || 
                    titleLower.includes('director') || 
                    titleLower.includes('vp') || 
                    titleLower.includes('vice president') || 
                    titleLower.includes('principal') ||
                    titleLower.includes('head');

                const isIndia = 
                    locationLower.includes('india') || 
                    locationLower.includes('pune') || 
                    locationLower.includes('mumbai') ||
                    locationLower.includes('bengaluru') ||
                    locationLower.includes('chennai');


                if (isEngineering && isIndia && !isTooSenior) {
                    if (locationLower === 'multiple locations' && jobUrl.includes('/us/') || jobUrl.includes('/uk/')) {
                        return; 
                    }

                    if (processedLinks.has(jobUrl)) {
                        return;
                    }
                    processedLinks.add(jobUrl);

                    const exists = await JobPosting.findOne({ applyLink: jobUrl });
                    
                    if (!exists) {
                        try {
                            await JobPosting.create({
                                companyName: 'Citi',
                                role: title,
                                location: location,
                                salaryRaw: 'Competitive', 
                                applyLink: jobUrl,
                                scrapedAt: new Date() 
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
            });
            
            if (currentBatchCount === 0) {
                hasMore = false;
            } else {
                currentPage++;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} targeted tech jobs for Citi.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Citi.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Citi right now.`);
        }

    } catch (error) {
        console.error("Citi Scraper Error:", error.message);
    }
};

module.exports = scrapeCitiJobs;
// scrapeCitiJobs();