const axios = require('axios');
const JobPosting = require('../models/job-posting');

const scrapeIntuitJobs = async () => {
    try {
        let page = 1;
        let hasMore = true;
        let jobsAdded = 0;
        let totalJobsFound = 0;

        while (hasMore) {
            const params = new URLSearchParams({
                'ActiveFacetID': '0',
                'CurrentPage': page.toString(),
                'RecordsPerPage': '15',
                'Distance': '50',
                'RadiusUnitType': '0',
                'Keywords': '',
                'Location': '',
                'ShowRadius': 'False',
                'IsPagination': 'True',
                'CustomFacetName': '',
                'FacetTerm': '68357',
                'FacetType': '1',
                'FacetFilters[0].ID': '68357',
                'FacetFilters[0].FacetType': '1',
                'FacetFilters[0].Count': '49',
                'FacetFilters[0].Display': 'Software Engineering',
                'FacetFilters[0].IsApplied': 'true',
                'FacetFilters[0].FieldName': '',
                'SearchResultsModuleName': 'Search Results',
                'SearchFiltersModuleName': 'Search Filters',
                'SortCriteria': '0',
                'SortDirection': '0',
                'SearchType': '2',
                'OrganizationIds': '27595',
                'PostalCode': '',
                'ResultsType': '0'
            });

            const url = `https://jobs.intuit.com/search-jobs/results?${params.toString()}`;

            const response = await axios.get(url, {
                headers: {
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://jobs.intuit.com/category/software-engineering-jobs/27595/68357/1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const htmlContent = response.data.results || '';

            if (!htmlContent || htmlContent.trim() === '') {
                hasMore = false;
                break;
            }

            const jobRegex = /<a\s+href="([^"]+)"[^>]*>[\s\S]*?<h2>([^<]+)<\/h2>[\s\S]*?<span\s+class="job-location">([^<]+)<\/span>/g;
            
            let match;
            let currentBatchCount = 0;

            while ((match = jobRegex.exec(htmlContent)) !== null) {
                currentBatchCount++;
                totalJobsFound++;

                const relativeUrl = match[1].trim();
                const title = match[2].trim();
                const location = match[3].trim();

                const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://jobs.intuit.com${relativeUrl}`;
                const titleLower = title.toLowerCase();
                const locationLower = location.toLowerCase();

                const isEngineering = 
                    titleLower.includes('software') || 
                    titleLower.includes('engineer') || 
                    titleLower.includes('developer') || 
                    titleLower.includes('sde') || 
                    titleLower.includes('mts') || 
                    titleLower.includes('architect') ||
                    titleLower.includes('data');

                const isIndia = 
                    locationLower.includes('india') || 
                    locationLower.includes('bengaluru') || 
                    locationLower.includes('bangalore') || 
                    locationLower.includes('hyderabad');

                const isTooSenior = 
                    title.includes('manager') || 
                    title.includes('director') || 
                    title.includes('vp') || 
                    title.includes('vice president') || 
                    title.includes('principal') ||
                    title.includes('head');

                if (isEngineering && isIndia && !isTooSenior) {
                    const exists = await JobPosting.findOne({ portalLink: jobUrl });

                    if (!exists) {
                        await JobPosting.create({
                            companyName: 'Intuit',
                            role: title,
                            location: location,
                            salary: 'Competitive',
                            applyLink: jobUrl,
                            postedDate: new Date()
                        });
                        jobsAdded++;
                    }
                }
            }

            if (currentBatchCount === 0 || page >= 10) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`[+] Scanned ${totalJobsFound} total tech postings across Intuit portal.`);
        if (jobsAdded > 0) {
            console.log(`[+] Added ${jobsAdded} new India Engineering jobs for Intuit.`);
        } else {
            console.log(`[-] No new India Engineering jobs found for Intuit right now.`);
        }

    } catch (error) {
        console.error("Intuit Scraper Error:", error.message);
    }
};

module.exports = scrapeIntuitJobs;
// scrapeIntuitJobs();