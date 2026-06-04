const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');


const cloudflareBypassAgent = new https.Agent({
    ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    honorCipherOrder: true,
    secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
});

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

const MONGO_URI = process.env.MONGO_URI;

//not all working needs fixing
const workdayCompanies = [
    {
        name: "BNY Mellon",
        url: "https://bnymellon.wd1.myworkdayjobs.com/wday/cxs/bnymellon/careers/jobs", // <-- Update this with the exact Network Tab URL
        payload: {
            limit: 20,
            offset: 0,
            searchText: "Software Engineer India" 
        }
    },
    {
        name: "BlackRock",
        url: "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/jobs",
        payload: {
            appliedFacets: {},
            limit: 20,
            offset: 0,
            searchText: "Engineer India"
        }
    },
    {
        name: "NVIDIA",
        url: "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs",
        payload: {
            appliedFacets: { 
                locationHierarchy1: ["2fcb99c455831013ea52b82135ba3266"] 
            },
            limit: 20,
            offset: 0,
            searchText: "Software Engineer" 
        }
    },
    {
        name: "Adobe",
        url: "https://adobe.wd5.myworkdayjobs.com/wday/cxs/adobe/external_experienced/jobs",
        payload: {
            appliedFacets: {},
            limit: 20,
            offset: 0,
            searchText: "Software Engineer India"
        }
    },
    {
        name: "Walmart",
        url: "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs",
        payload: {
            appliedFacets: {},
            limit: 20,
            offset: 0,
            searchText: "Software Engineer India"
        }
    },
    {
        name: "Mastercard",
        url: "https://mastercard.wd1.myworkdayjobs.com/wday/cxs/mastercard/CorporateCareers/jobs",
        payload: {
            appliedFacets: {},
            limit: 20,
            offset: 0,
            searchText: "Software Engineer India"
        }
    }
];

const scrapeWorkdayJobs = async () => {
    console.log(`Initiating internal API bypass across ${workdayCompanies.length} Workday boards...`);
    //await mongoose.connect(MONGO_URI);

    let totalAdded = 0;

    for (const company of workdayCompanies) {
        try {
            console.log(`\n Cracking ${company.name.toUpperCase()}...`);
            
            
            const apiUrl = `https://${company.host}/wday/cxs/${company.tenant}/${company.careerSite}/jobs`;
            
          
            const payload = {
                appliedFacets: {},
                limit: 20, 
                offset: 0, 
                searchText: "Software Engineer"
            };

            const response = await fetch(company.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    
                    'Origin': 'https://nvidia.wd5.myworkdayjobs.com',
                    'Referer': 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(company.payload),
                
                agent: cloudflareBypassAgent
            });

            if (!response.ok) {
                console.log(`[-] ${company.name} API returned ${response.status}. Skipping.`);
                continue;
            }

            const data = await response.json();
            const jobsData = data.jobPostings;

            if (!jobsData || jobsData.length === 0) {
                console.log(`[-] No jobs found on ${company.name}.`);
                continue;
            }

            const techJobs = jobsData.filter(job => {
                const location = (job.locationsText || '').toLowerCase();
                const isIndia = location.includes('india') || 
                                location.includes('bengaluru') || 
                                location.includes('bangalore') || 
                                location.includes('hyderabad') || 
                                location.includes('pune') ||
                                location.includes('mumbai') ||
                                location.includes('noida') ||
                                location.includes('gurugram') ||
                                location.includes('gurgaon');
                
                return isIndia;
            });

            if (techJobs.length === 0) {
                console.log(`[-] Found jobs for ${company.name}, but none matched the India filter.`);
                continue;
            }

            const formattedJobs = techJobs.map(job => ({
                companyName: company.name,
                role: String(job.title),
                location: String(job.locationsText),
                applyLink: `https://${company.host}/en-US/${company.careerSite}${job.externalPath}`,
                salaryRaw: "N/A" 
            }));

            let addedCount = 0;
            for (const job of formattedJobs) {
                const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
                if (!existingJob) {
                    await JobPosting.create(job);
                    addedCount++;
                    totalAdded++;
                }
                // addedCount++;
                // totalAdded++;
            }

            console.log(`[+] Added ${addedCount} new jobs for ${company.name}.`);

        } catch (error) {
            console.error(` Failed to process ${company.name}:`, error.message);
        }
    }

    console.log(`\n Workday Sweep Complete! Inserted ${totalAdded} brand new jobs.`);
    
};

module.exports = scrapeWorkdayJobs;
// scrapeWorkdayJobs();