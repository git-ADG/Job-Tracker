const JobPosting = require('../models/job-posting');

const scrapeMicrosoftJobs = async () => {
    try {
        let start = 0;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;

        const initResponse = await fetch('https://apply.careers.microsoft.com/careers?hl=en', {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const initHtml = await initResponse.text();
        const csrfMatch = initHtml.match(/csrf-token"\s+content="([^"]+)"/) || initHtml.match(/"csrfToken"\s*:\s*"([^"]+)"/);
        const csrfToken = csrfMatch ? csrfMatch[1] : '';
        
        const rawCookies = typeof initResponse.headers.getSetCookie === 'function' 
            ? initResponse.headers.getSetCookie() 
            : [initResponse.headers.get('set-cookie')].filter(Boolean);
            
        const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');

        while (hasMore) {
            const url = `https://apply.careers.microsoft.com/api/pcsx/search?domain=microsoft.com&start=${start}&sort_by=distance&filter_include_remote=1&filter_profession=software+engineering&hl=en`;

            const controller = new AbortController();
            const timeoutID = setTimeout(() => {
                controller.abort();
            }, 300000);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'x-csrf-token': csrfToken,
                        'cookie': sessionCookie,
                        'referer': 'https://apply.careers.microsoft.com/careers?hl=en',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    signal : controller.signal
                });
    
                clearTimeout(timeoutID);
    
                const jsonResponse = await response.json();
                //console.log(jsonResponse.data);
                const jobs = jsonResponse.data?.positions || jsonResponse.searchResults || [];
    
                if (jobs.length === 0) {
                    hasMore = false;
                    break;
                }
    
                totalJobsFound += jobs.length;
    
                for (const job of jobs) {
                    const title = (job.name || job.title || '').toLowerCase();
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
                        rawJobString.includes('hyderabad') || 
                        rawJobString.includes('pune') || 
                        rawJobString.includes('noida');
    
                    const isTooSenior = 
                        title.includes('manager') || 
                        title.includes('director') || 
                        title.includes('vp') || 
                        title.includes('vice president') || 
                        title.includes('principal') ||
                        title.includes('head');
    
                    if (isEngineering && isIndia && !isTooSenior) {
                        const jobUrl = job.positionUrl 
                            ? `https://apply.careers.microsoft.com${job.positionUrl}` 
                            : `https://apply.careers.microsoft.com/careers?pid=${job.id}`;
    
                        const exists = await JobPosting.findOne({ portalLink: jobUrl });
    
                        if (!exists) {
                            await JobPosting.create({
                                companyName: 'Microsoft',
                                role: job.name || job.title || 'Software Engineer',
                                location: Array.isArray(job.locations) ? job.locations.join(', ') : (job.location || 'India'),
                                salary: 'Competitive',
                                applyLink: jobUrl,
                                postedDate: job.postedTs ? new Date(job.postedTs * 1000) : new Date()
                            });
                            jobsAdded++;
                        }
                        // jobsAdded++;
                    }
                }
    
                start += jobs.length;
                if (jobs.length < 10) {
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

        console.log(`[+] Scanned ${totalJobsFound} total tech postings across Microsoft.`);
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Microsoft.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Microsoft right now.`);
        }

    } catch (error) {
        console.error("Microsoft Scraper Error:", error.message);
    }
};

// scrapeMicrosoftJobs();
module.exports = scrapeMicrosoftJobs;