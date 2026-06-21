
const JobPosting = require('../models/job-posting');

const scrapeCiscoJobs = async () => {
    try {
        let fromRecord = 0;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;

        console.log("Initiating Cisco Component-Bypass Scraper...");

        const initResponse = await fetch('https://careers.cisco.com/global/en/c/product-and-engineering-jobs', {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const initHtml = await initResponse.text();
        const csrfMatch = initHtml.match(/csrfToken"\s*:\s*"([^"]+)"/) || initHtml.match(/csrf-token"\s+content="([^"]+)"/);
        const csrfToken = csrfMatch ? csrfMatch[1] : '';

        const rawCookies = initResponse.headers.getSetCookie 
            ? initResponse.headers.getSetCookie() 
            : [initResponse.headers.get('set-cookie')].filter(Boolean);
        const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');

        while (hasMore) {
            const url = 'https://careers.cisco.com/widgets';

            const payload = {
                "sortBy": "",
                "subsearch": "",
                "from": fromRecord,
                "jobs": true,
                "counts": true,
                "all_fields": ["category", "raasJobRequisitionType", "country", "state", "city", "type", "RemoteType"],
                "pageName": "product-and-engineering",
                "pageType": "category",
                "size": 50, 
                "clearAll": false,
                "jdsource": "facets",
                "isSliderEnable": false,
                "pageId": "page490-prod",
                "siteType": "external",
                "keywords": "",
                "global": true,
                "selected_fields": {
                    "category": ["Product and Engineering"],
                    "raasJobRequisitionType": ["Entry Level Talent"]
                },
                "lang": "en_global",
                "deviceType": "desktop",
                "country": "global",
                "refNum": "CISCISGLOBAL",
                "ddoKey": "refineSearch"
            };

            const controller = new AbortController();
            const timeoutID = setTimeout(() => {
                controller.abort();
            }, 300000);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'content-type': 'application/json',
                        'x-csrf-token': csrfToken,
                        'cookie': sessionCookie,
                        'origin': 'https://careers.cisco.com',
                        'referer': 'https://careers.cisco.com/global/en/c/product-and-engineering-jobs',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    body: JSON.stringify(payload),
                    signal : controller.signal
                });

                clearTimeout(timeoutID);
    
                if (!response.ok) {
                    console.error(`Cisco API rejected request with status: ${response.status}`);
                    break;
                }
    
                const jsonResponse = await response.json();
                
                const jobsContainer = jsonResponse.refineSearch || {};
                // console.log(jobsContainer.data?.jobs);
                const jobs = jobsContainer.data?.jobs || [];
    
                if (jobs.length === 0) {
                    hasMore = false;
                    break;
                }
    
                totalJobsFound += jobs.length;
    
                for (const job of jobs) {
                    const title = (job.title || job.name || '').toLowerCase();
                    const rawJobString = JSON.stringify(job).toLowerCase();
    
                    const isEngineering = 
                        title.includes('software engineer') ||  
                        title.includes('developer')
                        title.includes('architect') ||
                        title.includes('data');
    
                    const isIndia = 
                        rawJobString.includes('india') || 
                        rawJobString.includes('bengaluru') || 
                        rawJobString.includes('bangalore') || 
                        rawJobString.includes('hyderabad') ||
                        rawJobString.includes('pune');
                    
                    const isTooSenior = 
                        title.includes('manager') || 
                        title.includes('director') || 
                        title.includes('vp') || 
                        title.includes('vice president') || 
                        title.includes('principal') ||
                        title.includes('head');
    
                    if (isEngineering && isIndia && !isTooSenior) {
                        const jobId = job.jobId || job.id;
                        if (!jobId) continue;
    
                        const jobUrl = `https://careers.cisco.com/global/en/job/${jobId}`;
                        const exists = await JobPosting.findOne({ portalLink: jobUrl });
    
                        if (!exists) {
                            await JobPosting.create({
                                companyName: 'Cisco',
                                role: job.title || 'Software Engineer',
                                location: job.location || 'India (Multiple)',
                                salary: 'Competitive',
                                applyLink: jobUrl,
                                postedDate: job.postedDate ? new Date(job.postedDate) : new Date()
                            });
                            jobsAdded++;
                        }
                    }
                }
    
                const totalHits = jobsContainer.totalHits || 0;
                fromRecord += jobs.length;
    
                if (fromRecord >= totalHits || jobs.length === 0) {
                    hasMore = false;
                }
            } catch (error) {
                if(error.name === 'AbortError'){
                    console.error("[-] Fetch request to Apple aborted due to 5-minute timeout.");
                    break;
                }else{
                    throw error;
                }
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} positions across Cisco.`);
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Cisco.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Cisco right now.`);
        }

    } catch (error) {
        console.error("Cisco Scraper Error:", error.message);
    }
};

module.exports = scrapeCiscoJobs;
// scrapeCiscoJobs();