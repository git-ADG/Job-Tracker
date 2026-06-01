const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

const MONGO_URI = process.env.MONGO_URI;

const workdayCompanies = [
    { 
        name: 'Nvidia', 
        host: 'nvidia.wd5.myworkdayjobs.com', 
        tenant: 'nvidia', 
        careerSite: 'NVIDIAExternalCareerSite' 
    },
    { 
        name: 'Adobe', 
        host: 'adobe.wd5.myworkdayjobs.com', 
        tenant: 'adobe', 
        careerSite: 'external_experienced' 
    },
    { 
        name: 'Walmart', 
        host: 'walmart.wd5.myworkdayjobs.com', 
        tenant: 'walmart', 
        careerSite: 'WalmartExternal' 
    },
    { 
        name: 'Mastercard', 
        host: 'mastercard.wd1.myworkdayjobs.com', 
        tenant: 'mastercard', 
        careerSite: 'CorporateCareers' 
    },
    { 
        name: 'Morgan Stanley', 
        host: 'ms.wd1.myworkdayjobs.com', 
        tenant: 'ms', 
        careerSite: 'External' 
    },
    {
        name: 'Goldman Sachs', 
        host: 'goldmansachs.wd1.myworkdayjobs.com', 
        tenant: 'goldmansachs', 
        careerSite: 'Goldman_Sachs_Careers'
    }
];

const scrapeWorkdayJobs = async () => {
    console.log(`Initiating internal API bypass across ${workdayCompanies.length} Workday boards...`);
    //await mongoose.connect(MONGO_URI);

    let totalAdded = 0;

    for (const company of workdayCompanies) {
        try {
            console.log(`\n🔍 Cracking ${company.name.toUpperCase()}...`);
            
            
            const apiUrl = `https://${company.host}/wday/cxs/${company.tenant}/${company.careerSite}/jobs`;
            
          
            const payload = {
                appliedFacets: {},
                limit: 20, 
                offset: 0, 
                searchText: "Software Engineer"
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(payload)
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
                                location.includes('pune');
                
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
            }

            console.log(`[+] Added ${addedCount} new jobs for ${company.name}.`);

        } catch (error) {
            console.error(`❌ Failed to process ${company.name}:`, error.message);
        }
    }

    console.log(`\n🎉 Workday Sweep Complete! Inserted ${totalAdded} brand new jobs.`);
    
};

module.exports = scrapeWorkdayJobs;