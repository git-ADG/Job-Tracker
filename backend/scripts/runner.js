process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const scrapeGoogleJobs = require('./googleScraper');
const scrapeAmazonJobs = require('./amazonScraper');
const scrapeAppleJobs = require('./appleScraper');
const scrapeMicrosoftJobs = require('./microsoftScraper');
const scrapeGreenhouseJobs = require('./greenhouseScraper');
const scrapeLeverJobs = require('./leverScraper');
const scrapeWorkdayJobs = require('./workdayScraper');

const runAllScrapers = async () => {
    console.log("🚀 [MASTER RUNNER] Initiating FAANG Scrape Sequence...");
    const startTime = Date.now();

    try {
        console.log("--- Starting Google ---");
        await scrapeGoogleJobs();
        
        console.log("--- Starting Amazon ---");
        await scrapeAmazonJobs();

        // console.log("--- Starting Apple ---");
        // await scrapeAppleJobs();

        // console.log("--- Starting Microsoft ---");
        // await scrapeMicrosoftJobs();
        console.log('---Starting GreenHouse---');
        await scrapeGreenhouseJobs();

        console.log('---Starting Lever---');
        await scrapeLeverJobs();

        console.log('---Starting workday---');
        await scrapeWorkdayJobs();

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [MASTER RUNNER] All scrapes completed successfully in ${timeTaken} seconds.`);
    } catch (error) {
        console.error("❌ [MASTER RUNNER] Sequence failed:", error);
    }
};

// module.exports = runAllScrapers;
runAllScrapers();