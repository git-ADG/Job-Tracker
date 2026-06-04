process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

const scrapeGoogleJobs = require('./googleScraper');
const scrapeAmazonJobs = require('./amazonScraper');
const scrapeAtlassianJobs = require('./atlassianScraper');
const scrapeAppleJobs = require('./appleScraper');
const scrapeMicrosoftJobs = require('./microsoftScraper');
const scrapeGreenhouseJobs = require('./greenhouseScraper');
const scrapeLeverJobs = require('./leverScraper');
const scrapeWorkdayJobs = require('./workdayScraper');
const scrapeGithubJobs = require('./githubScraper');
const scrapeGoldmanSachsJobs = require('./goldmanSachsScraper');
const scrapeSalesforceJobs = require('./salesforceScraper');
const scrapeMorganStanleyJobs = require('./morganStanleyScraper');
const scrapeIntuitJobs = require('./intuitScraper');
const scrapeUberJobs = require('./uberScraper');
const scrapeCiscoJobs = require('./ciscoScraper');
const scrapeHsbcJobs = require('./hsbcScraper');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

//email ocassionally throwing timeout, needs fixing
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,           
    secure: false,       
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    },
    pool: true,
    connectionTimeout: 60000,
    family : 4
});

const sendEmailReport = async (summaryHtml, isError = false) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECEIVER_EMAIL,
        subject: `Job Tracker Scraper Report - ${new Date().toLocaleDateString('en-IN')}`,
        html: summaryHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("[EMAIL] Status report sent successfully.");
    } catch (err) {
        console.error("[EMAIL] Failed to send email:", err.message);
    }
};

//database cleared and jobs fetched fresh
//done for 2 reasons
//avoid duplicates
//remove closed job openings
const clearDatabase = async () => {
    console.log("[DATABASE] Purging old job listings...");
    
    const result = await JobPosting.deleteMany({}); 
    
    console.log(`[DATABASE] Successfully deleted ${result.deletedCount} closed jobs.`);
    return result.deletedCount; 
};

//master runner
//runs all scripts whenever called by the node cron job
const runAllScrapers = async () => {
    console.log("[MASTER RUNNER] Initiating FAANG Scrape Sequence...");
    const startTime = Date.now();
    let reportLogs = [];
    let criticalError = null;

    const executeScraper = async (name, scraperFunc) => {
        try {
            console.log(`--- Starting ${name} ---`);
            await scraperFunc();
            reportLogs.push(`<li><b>${name}:</b> Completed successfully.</li>`);
        } catch (err) {
            console.error(`❌ ${name} Failed:`, err.message);
            reportLogs.push(`<li><b>${name} Failed:</b> <span style="color:red;">${err.message}</span></li>`);
        }
    };

    try {
        console.log("---Starting delete---");
        let deletedCount = 0;
        try {
            deletedCount = await clearDatabase();
            reportLogs.push(`<li> <b>Database Purge:</b> Removed ${deletedCount} older jobs.</li>`);
        } catch (err) {
            reportLogs.push(`<li> <b>Database Purge Failed:</b> ${err.message}</li>`);
        }

        await executeScraper('Google', scrapeGoogleJobs);
        await executeScraper('Amazon', scrapeAmazonJobs);

        await executeScraper('Apple', scrapeAppleJobs);
        await executeScraper('Microsoft', scrapeMicrosoftJobs);

        await executeScraper('GreenHouse', scrapeGreenhouseJobs);
        await executeScraper('Lever', scrapeLeverJobs);

        await executeScraper('Workday', scrapeWorkdayJobs);

        await executeScraper('Atlassian', scrapeAtlassianJobs);
        await executeScraper('GitHub', scrapeGithubJobs);
        await executeScraper('Goldman Sachs', scrapeGoldmanSachsJobs);
        await executeScraper('Salesforce', scrapeSalesforceJobs);
        await executeScraper('Morgan Stanley', scrapeMorganStanleyJobs);
        await executeScraper('Intuit', scrapeIntuitJobs);
        await executeScraper('Uber', scrapeUberJobs);

        await executeScraper('Cisco', scrapeCiscoJobs);

        await executeScraper('HSBC', scrapeHsbcJobs);

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[MASTER RUNNER] All scrapes completed successfully in ${timeTaken} seconds.`);

        let currentTotalJobs = 0;
        try {
            currentTotalJobs = await JobPosting.countDocuments({});
        } catch (err) {
            criticalError = `Could not verify database job count: ${err.message}`;
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; border-bottom: 2px solid #0076ff; padding-bottom: 10px;">Pipeline Execution Summary</h2>
                <p><b>Execution Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</p>
                <p><b>Duration:</b> ${timeTaken} seconds</p>
                <p style="font-size: 16px;"><b>Current Active Jobs in Database:</b> <span style="color: #0076ff; font-weight: bold;">${currentTotalJobs}</span></p>
                
                <h3 style="color: #555;">Logs per Pipeline Module:</h3>
                <ul style="line-height: 1.8; padding-left: 20px;">
                    ${reportLogs.join('')}
                </ul>
                
                ${criticalError ? `<p style="color: red; font-weight: bold;">⚠️ Critical Runner Alert: ${criticalError}</p>` : ''}
                
                <p style="font-size: 12px; color: #aaa; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                    Automated notification from your Cloud JobTracker Pipeline.
                </p>
            </div>
        `;

        await sendEmailReport(emailHtml, reportLogs.some(log => log.includes('Failed')));

    } catch (error) {
        console.error("[MASTER RUNNER] Sequence failed:", error);
    }
};

module.exports = runAllScrapers;
// runAllScrapers();