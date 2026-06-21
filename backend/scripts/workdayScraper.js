const axios = require('axios');
axios.defaults.timeout = 300000;
const https = require('https');
const crypto = require('crypto');
const JobPosting = require('../models/job-posting');

const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

const workdayCompanies = [
    {
        name: "Visa",
        apiUrl: "https://visa.wd5.myworkdayjobs.com/wday/cxs/visa/Visa/jobs",
        siteBaseUrl: "https://visa.wd5.myworkdayjobs.com/en-US/Visa",
        searchText: "software engineer india"
    },
    {
        name: "Walmart",
        apiUrl: "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs", 
        siteBaseUrl : "https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal",
        searchText: "software engineer india"
    },
    {
        name: "Mastercard",
        apiUrl: "https://mastercard.wd1.myworkdayjobs.com/wday/cxs/mastercard/CorporateCareers/jobs",
        siteBaseUrl: "https://mastercard.wd1.myworkdayjobs.com/en-US/CorporateCareers",
        searchText: "software engineer india"
    },
    {
        name: "BNY Mellon",
        apiUrl: "https://bnymellon.wd1.myworkdayjobs.com/wday/cxs/bnymellon/careers/jobs",
        siteBaseUrl: "https://bnymellon.wd1.myworkdayjobs.com/en-US/careers",
        searchText: "software engineer india"
    },
    {
        name: "NVIDIA",
        apiUrl: "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs",
        siteBaseUrl: "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite",
        searchText: "software engineer" 
    },
    {
        name: "Adobe",
        apiUrl: "https://adobe.wd5.myworkdayjobs.com/wday/cxs/adobe/external_experienced/jobs",
        siteBaseUrl: "https://adobe.wd5.myworkdayjobs.com/en-US/external_experienced",
        searchText: "software engineer india"
    },
    {
        name: "BlackRock",
        apiUrl: "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/jobs", 
        siteBaseUrl : "https://blackrock.wd1.myworkdayjobs.com/en-US/BlackRock_Professional" ,
        searchText: "software engineer india"
    }
];

const scrapeWorkdayJobs = async () => {
    console.log(`Initiating internal API bypass across ${workdayCompanies.length} Workday boards...`);

    let totalAddedAcrossAll = 0;

    for (const company of workdayCompanies) {
        try {
            console.log(`\n Cracking ${company.name.toUpperCase()}...`);
            
            let offset = 0;
            const limit = 20;
            let hasMore = true;
            let jobsAdded = 0;
            let totalJobsFound = 0;

            while (hasMore) {
                const payload = {
                    appliedFacets: {},
                    limit: limit,
                    offset: offset,
                    searchText: company.searchText
                };

                const response = await axios.post(company.apiUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    
                        'Origin': 'https://nvidia.wd5.myworkdayjobs.com',
                        'Referer': 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
                    },
                    httpsAgent: cloudflareBypassAgent
                });

                const jobsData = response.data.jobPostings || [];

                if (jobsData.length === 0) {
                    hasMore = false;
                    break;
                }

                totalJobsFound += jobsData.length;

                for (const job of jobsData) {
                    const titleLower = (job.title || '').toLowerCase();
                    const locationLower = (job.locationsText || '').toLowerCase();
                    // console.log(titleLower + ' ' + locationLower);

                    const isEngineering = 
                        titleLower.includes('software') || 
                        titleLower.includes('engineer') || 
                        titleLower.includes('developer') || 
                        titleLower.includes('sde') || 
                        titleLower.includes('data');

                    const isTooSenior = 
                        titleLower.includes('manager') || 
                        titleLower.includes('director') || 
                        titleLower.includes('vp') || 
                        titleLower.includes('vice president') || 
                        titleLower.includes('principal') ||
                        titleLower.includes('head') ||
                        titleLower.includes('lead') ||
                        titleLower.includes('staff');

                    const isIndia = 
                        locationLower.includes('india') || 
                        locationLower.includes('bengaluru') || 
                        locationLower.includes('bangalore') || 
                        locationLower.includes('hyderabad') || 
                        locationLower.includes('pune') ||
                        locationLower.includes('mumbai') ||
                        locationLower.includes('chennai') ||
                        locationLower.includes('noida') ||
                        locationLower.includes('gurugram') ||
                        locationLower.includes('gurgaon');

                    if (isEngineering && isIndia && !isTooSenior) {
                        const jobUrl = `${company.siteBaseUrl}${job.externalPath}`;
                        
                        const exists = await JobPosting.findOne({ applyLink: jobUrl });
                        
                        if (!exists) {
                            try {
                                await JobPosting.create({
                                    companyName: company.name,
                                    role: job.title,
                                    location: job.locationsText || 'India',
                                    salaryRaw: "Competitive", 
                                    applyLink: jobUrl,
                                    //scrapedAt: job.postedOn ? new Date(job.postedOn) : new Date()
                                });
                                jobsAdded++;
                                totalAddedAcrossAll++;
                            } catch (dbError) {
                                if (dbError.code !== 11000) {
                                    console.error("Database Error:", dbError.message);
                                }
                            }
                        }
                        // jobsAdded++;
                    }
                }

                offset += limit;
                if (jobsData.length < limit) {
                    hasMore = false; 
                }
            }

            console.log(`[+] Scanned ${totalJobsFound} tech jobs. Added ${jobsAdded} new entry-level India jobs for ${company.name}.`);

        } catch (error) {
            console.error(`[-] Failed to process ${company.name}:`, error.message);
        }
    }

    console.log(`\nWorkday Sweep Complete! Inserted ${totalAddedAcrossAll} brand new entry-level jobs across all boards.`);
};

module.exports = scrapeWorkdayJobs;
// scrapeWorkdayJobs();