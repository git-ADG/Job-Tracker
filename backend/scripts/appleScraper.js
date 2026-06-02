
const JobPosting = require('../models/job-posting');

const scrapeAppleJobs = async () => {
    try {
        let page = 1;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;

        console.log("Initiating Apple CSRF-Stealth Scraper...");

        while (hasMore) {
            const url = 'https://jobs.apple.com/api/v1/search/page';
            
            const payload = {
                query: "software engineer",
                filters: {
                    location: ["india-INDC"],
                    team: [
                        "apps-and-frameworks-SFTWR-AF",
                        "cloud-and-infrastructure-SFTWR-CLD",
                        "core-operating-systems-SFTWR-COS",
                        "devops-and-site-reliability-SFTWR-DSR",
                        "engineering-project-management-SFTWR-EPM",
                        "information-systems-and-technology-SFTWR-ISTECH",
                        "machine-learning-SFTWR-MCHLN",
                        "security-and-privacy-SFTWR-SEC",
                        "software-quality-automation-tools-SFTWR-SQAT",
                        "wireless-software-SFTWR-WSFT"
                    ]
                },
                page: page,
                sort: "relevance"
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'Origin': 'https://jobs.apple.com',
                    'Referer': 'https://jobs.apple.com/en-in/search?sort=relevance&location=india-INDC',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`Apple API rejected request with status: ${response.status}`);
                break;
            }

            const jsonResponse = await response.json();
            console.log(jsonResponse.searchResults);
            const jobs = jsonResponse.searchResults || jsonResponse.positions || [];

            if (jobs.length === 0) {
                hasMore = false;
                break;
            }

            totalJobsFound += jobs.length;

            for (const job of jobs) {
                const title = (job.postingTitle || job.title || job.name || '').toLowerCase();
                const rawJobString = JSON.stringify(job).toLowerCase();

                const isEngineering = 
                    title.includes('software') || 
                    title.includes('engineer') || 
                    title.includes('developer') || 
                    title.includes('sde') || 
                    title.includes('mts') || 
                    title.includes('architect') ||
                    title.includes('data') ||
                    rawJobString.includes('engineering');

                const isIndia = 
                    rawJobString.includes('india') || 
                    rawJobString.includes('bengaluru') || 
                    rawJobString.includes('bangalore') || 
                    rawJobString.includes('hyderabad');

                if (isEngineering && isIndia) {
                    const jobId = job.id || job.jobId || job.positionId;
                    if (!jobId) continue;

                    const jobUrl = `https://jobs.apple.com/en-in/details/${jobId}`;
                    const exists = await JobPosting.findOne({ portalLink: jobUrl });

                    if (!exists) {
                        let locStr = 'India';
                        if (Array.isArray(job.locations) && job.locations[0]) {
                            locStr = `${job.locations[0].city || 'India'}, ${job.locations[0].countryName || ''}`;
                        } else if (job.location) {
                            locStr = job.location;
                        }

                        await JobPosting.create({
                            companyName: 'Apple',
                            role: job.postingTitle || job.title || 'Software Engineer',
                            location: locStr,
                            salary: 'Competitive',
                            applyLink: jobUrl,
                            postedDate: job.jobArrivalDate ? new Date(job.jobArrivalDate) : new Date()
                        });
                        jobsAdded++;
                    }
                }
            }

            const totalRecords = jsonResponse.totalRecords || 0;
            if (totalJobsFound >= totalRecords || jobs.length === 0) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} total postings across Apple.`);
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Apple.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Apple right now.`);
        }

    } catch (error) {
        console.error("Apple Scraper Error:", error.message);
    }
};

module.exports = scrapeAppleJobs;
// scrapeAppleJobs();