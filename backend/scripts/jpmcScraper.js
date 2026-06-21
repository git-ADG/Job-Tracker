const axios = require('axios');
axios.defaults.timeout = 300000;
const JobPosting = require('../models/job-posting');

const scrapeJpmcJobs = async () => {
    try {
        let offset = 0;
        const limit = 25; 
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;
        
        const processedLinks = new Set();

        console.log("Initiating JPMC Oracle HCM Targeted Scraper...");

        while (hasMore) {
            const url = `https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.workLocation,requisitionList.otherWorkLocations,requisitionList.secondaryLocations,flexFieldsFacet.values,requisitionList.requisitionFlexFields&finder=findReqs;siteNumber=CX_1001,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=${limit},keyword=%22software%20engineer%22,locationId=300000000289360,sortBy=RELEVANCY,offset=${offset}`;

            const response = await axios.get(url, {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en',
                    'Content-Type': 'application/vnd.oracle.adf.resourceitem+json;charset=utf-8',
                    'Referer': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs?keyword=software+engineer&location=India&locationId=300000000289360&locationLevel=country&mode=location',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const jobs = response.data.items[0]?.requisitionList || [];

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
                    title.includes('architect') ||
                    title.includes('data') ||
                    rawJobString.includes('engineering') ||
                    rawJobString.includes('technology');

                    const isTooSenior = 
                        title.includes('manager') || 
                        title.includes('director') || 
                        title.includes('vp') || 
                        title.includes('vice president') || 
                        title.includes('principal') ||
                        title.includes('head');

                if (isEngineering && !isTooSenior) {
                    const jobUrl = `https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/${job.Id}`;
                    
                    if (processedLinks.has(jobUrl)) {
                        continue;
                    }
                    processedLinks.add(jobUrl);

                    const exists = await JobPosting.findOne({ applyLink: jobUrl });
                    
                    if (!exists) {
                        try {
                            let jobLocation = 'India (Multiple)';
                            if (job.PrimaryLocation) {
                                jobLocation = job.PrimaryLocation;
                            } else if (job.workLocation && job.workLocation.length > 0) {
                                jobLocation = job.workLocation[0].Name || 'India';
                            }

                            await JobPosting.create({
                                companyName: 'JPMorgan Chase & Co.',
                                role: job.Title || 'Software Engineer',
                                location: jobLocation,
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
                    // jobsAdded++;
                }
            }
            
            offset += limit;
            
            if (jobs.length < limit) {
                hasMore = false;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} targeted tech jobs for JPMC.`);
        
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for JPMC.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for JPMC right now.`);
        }

    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("JPMC Scraper Error:", errorMsg);
    }
};

module.exports = scrapeJpmcJobs;
// scrapeJpmcJobs();