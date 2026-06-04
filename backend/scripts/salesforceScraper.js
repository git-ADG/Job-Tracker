const axios = require('axios');
const JobPosting = require('../models/job-posting');

//structured but highly nested data
//location causing problems
const scrapeSalesforceJobs = async () => {
    try {
        console.log('Initiating Salesforce CDN Sweep...');

        const url = 'https://a.sfdcstatic.com/digital/xsf/careers/jobs_1.json';
        
        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json',
                'origin': 'https://www.salesforce.com',
                'referer': 'https://www.salesforce.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        //console.log(response.data);



        const jobs = response.data.Report_Entry || [];
        let jobsAdded = 0;

        console.log(`Downloaded ${jobs.length} total global jobs from Salesforce CDN... filtering...`);

        for (const job of jobs) {
            const title = (job.Title || job.Job_Title || job.title || job.Job_Posting_Title || '').toLowerCase();
            const rawJobString = JSON.stringify(job).toLowerCase();

            const location = job.Job_Requisition_Primary_Location.toLowerCase();
            // console.log(location);
            const isEngineering = 
                title.includes('software') || 
                title.includes('engineer') || 
                title.includes('developer') || 
                title.includes('sde') || 
                title.includes('mts') || 
                title.includes('technical staff') ||
                title.includes('architect') ||
                title.includes('data') ||
                rawJobString.includes('engineering') ||
                rawJobString.includes('technology') ||
                rawJobString.includes('r&d');
            
            const isIndia = 
                location.includes('india') || 
                location.includes('bengaluru') || 
                location.includes('bangalore') || 
                location.includes('hyderabad') && !(location.includes('indiana'));

            const isTooSenior = 
                    title.includes('manager') || 
                    title.includes('director') || 
                    title.includes('vp') || 
                    title.includes('vice president') || 
                    title.includes('principal') ||
                    title.includes('head');

            if (isEngineering && isIndia && !isTooSenior) {
                const jobUrl = job.External_Job_Posting_Site || job.url;
                
                if (!jobUrl) continue; 

                const exists = await JobPosting.findOne({ portalLink: jobUrl });
                
                if (!exists) {
                    await JobPosting.create({
                        companyName: 'Salesforce',
                        role:  job.Job_Posting_Title || 'Software Engineer',
                        location: job.Job_Requisition_Primary_Location || 'India (Multiple)',
                        salary: 'Competitive', 
                        applyLink: jobUrl,
                        postedDate: job.External_Job_Posting_Start_Date ? new Date(job.External_Job_Posting_Start_Date) : new Date()
                    });
                    jobsAdded++;
                }
                // jobsAdded++;
            }
        }
        
        if (jobsAdded > 0) {
            console.log(`Added ${jobsAdded} new India Engineering jobs for Salesforce.`);
        } else {
            console.log(`No new India Engineering jobs found for Salesforce right now.`);
        }

    } catch (error) {
        console.error("Salesforce Scraper Error:", error.message);
    }
};

// scrapeSalesforceJobs();
module.exports = scrapeSalesforceJobs;