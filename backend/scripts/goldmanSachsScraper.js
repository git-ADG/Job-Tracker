const axios = require('axios');
axios.defaults.timeout = 300000;
const JobPosting = require('../models/job-posting');

const scrapeGoldmanSachsJobs = async () => {
    try {
        const url = 'https://api-higher.gs.com/gateway/api/v1/graphql';
        
        const payload = {
            "operationName": "GetRoles",
            "variables": {
                "searchQueryInput": {
                    "page": { "pageSize": 100, "pageNumber": 0 },
                    "sort": { "sortStrategy": "RELEVANCE", "sortOrder": "DESC" },
                    "filters": [],
                    "experiences": ["EARLY_CAREER", "PROFESSIONAL"],
                    "searchTerm": "software engineer india"
                }
            },
            "query": "query GetRoles($searchQueryInput: RoleSearchQueryInput!) {\n  roleSearch(searchQueryInput: $searchQueryInput) {\n    totalCount\n    items {\n      roleId\n      corporateTitle\n      jobTitle\n      jobFunction\n      locations {\n        primary\n        state\n        country\n        city\n      }\n      status\n      division\n      skills\n    }\n  }\n}"
        };

        const response = await axios.post(url, payload, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const jobs = response.data?.data?.roleSearch?.items || [];
        let jobsAdded = 0;

        console.log(`[+] Found ${jobs.length} total pre-filtered jobs for Goldman Sachs... verifying...`);

        for (const job of jobs) {
            const title = (job.jobTitle || '').toLowerCase();
            const rawLocation = JSON.stringify(job.locations || []).toLowerCase();
            const rawDepartment = JSON.stringify(job.jobFunction || job.division || '').toLowerCase();

            const isEngineering = 
                title.includes('software') || 
                title.includes('engineer') || 
                title.includes('developer') || 
                title.includes('sde') || 
                title.includes('mts') || 
                title.includes('technical staff') ||
                title.includes('architect') ||
                title.includes('data') ||
                rawDepartment.includes('engineering') ||
                rawDepartment.includes('technology') ||
                rawDepartment.includes('r&d');
            
            const isIndia = 
                rawLocation.includes('india') || 
                rawLocation.includes('bengaluru') || 
                rawLocation.includes('bangalore') || 
                rawLocation.includes('hyderabad') ||
                rawLocation.includes('remote - ind');

            const isTooSenior = 
                    title.includes('manager') || 
                    title.includes('director') || 
                    title.includes('vp') || 
                    title.includes('vice president') || 
                    title.includes('principal') ||
                    title.includes('head');

            if (isEngineering && isIndia && !isTooSenior && job.status !== 'CLOSED') {
                
                const jobUrl = `https://higher.gs.com/roles/${job.roleId}`;
                
                const exists = await JobPosting.findOne({ portalLink: jobUrl });
                
                if (!exists) {
                    
                    let primaryLocation = 'India (Multiple)';
                    if (job.locations && job.locations.length > 0) {
                        const primaryNode = job.locations.find(loc => loc.primary) || job.locations[0];
                        primaryLocation = primaryNode.city ? `${primaryNode.city}, India` : 'India';
                    }

                    await JobPosting.create({
                        companyName: 'Goldman Sachs',
                        role: job.corporateTitle ? `${job.jobTitle} (${job.corporateTitle})` : job.jobTitle,
                        location: primaryLocation,
                        salary: 'Competitive', 
                        applyLink: jobUrl,
                        postedDate: new Date() 
                    });
                    jobsAdded++;
                }
            }
        }

        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Goldman Sachs.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Goldman Sachs right now.`);
        }

    } catch (error) {
        console.error(" Goldman Sachs Scraper Error:", error.message);
    }
};

module.exports = scrapeGoldmanSachsJobs;
// scrapeGoldmanSachsJobs();