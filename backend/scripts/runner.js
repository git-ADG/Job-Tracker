process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

const scrapeGoogleJobs = require('./googleScraper');
const scrapeAmazonJobs = require('./amazonScraper');
const scrapeAppleJobs = require('./appleScraper');
const scrapeMicrosoftJobs = require('./microsoftScraper');
const scrapeGreenhouseJobs = require('./greenhouseScraper');
const scrapeLeverJobs = require('./leverScraper');
const scrapeWorkdayJobs = require('./workdayScraper');

dotenv.config({ path: path.join(__dirname, '../.env') });
const JobPosting = require('../models/job-posting');

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
    connectionTimeout: 15000
});

const sendEmailReport = async (summaryHtml, isError = false) => {
    const statusEmoji = isError ? '❌' : '✅';
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECEIVER_EMAIL,
        subject: `${statusEmoji} Job Tracker Scraper Report - ${new Date().toLocaleDateString('en-IN')}`,
        html: summaryHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("📨 [EMAIL] Status report sent successfully.");
    } catch (err) {
        console.error("❌ [EMAIL] Failed to send email:", err.message);
    }
};

const clearDatabase = async () => {
    console.log("🧹 [DATABASE] Purging old job listings...");
    //const MONGO_URI = process.env.MONGO_URI;
    
    //await mongoose.connect(MONGO_URI);
    
    const result = await JobPosting.deleteMany({}); 
    
    console.log(`🗑️ [DATABASE] Successfully deleted ${result.deletedCount} closed jobs.`);
    //await mongoose.disconnect();
    return result.deletedCount; 
};

const runAllScrapers = async () => {
    console.log("🚀 [MASTER RUNNER] Initiating FAANG Scrape Sequence...");
    const startTime = Date.now();
    let reportLogs = [];
    let criticalError = null;

    const executeScraper = async (name, scraperFunc) => {
        try {
            console.log(`--- Starting ${name} ---`);
            await scraperFunc();
            reportLogs.push(`<li>✅ <b>${name}:</b> Completed successfully.</li>`);
        } catch (err) {
            console.error(`❌ ${name} Failed:`, err.message);
            reportLogs.push(`<li>❌ <b>${name} Failed:</b> <span style="color:red;">${err.message}</span></li>`);
        }
    };

    try {
        console.log("---Starting delete---");
        let deletedCount = 0;
        try {
            deletedCount = await clearDatabase();
            reportLogs.push(`<li>🧹 <b>Database Purge:</b> Removed ${deletedCount} older jobs.</li>`);
        } catch (err) {
            reportLogs.push(`<li>❌ <b>Database Purge Failed:</b> ${err.message}</li>`);
        }

        await executeScraper('Google', scrapeGoogleJobs);
        await executeScraper('Amazon', scrapeAmazonJobs);

        // await executeScraper('Apple', scrapeAppleJobs);

        // await executeScraper('Microsoft', scrapeMicrosoftJobs);

        await executeScraper('GreenHouse', scrapeGreenhouseJobs);
        await executeScraper('Lever', scrapeLeverJobs);
        await executeScraper('Workday', scrapeWorkdayJobs);

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [MASTER RUNNER] All scrapes completed successfully in ${timeTaken} seconds.`);

        let currentTotalJobs = 0;
        try {
            //await mongoose.connect(process.env.MONGO_URI);
            currentTotalJobs = await JobPosting.countDocuments({});
            //await mongoose.disconnect();
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
        console.error("❌ [MASTER RUNNER] Sequence failed:", error);
    }
};

module.exports = runAllScrapers;
//runAllScrapers();