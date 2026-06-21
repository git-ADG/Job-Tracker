const axios = require('axios');
axios.defaults.timeout = 300000;
//const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const JobPosting = require('../models/job-posting');

dotenv.config({path : path.join(__dirname, '../.env')});

//const MONGO_URI = process.env.MONGO_URI;
//console.log("Database URI targeting:", MONGO_URI);


//heavy security, took time to locate the api
//highly scraper resistant
//raw unformatted data, headache to retrieve
//needed recursion to find the array containing the required data
//slow and time consuming scraper
const scrapeGoogleJobs = async () => {
  console.log("Initiating stealth batchexecute request to Google...");

  try {
    //needs formatting
    //working for now
    const response = await axios.post(
          'https://www.google.com/about/careers/applications/_/HiringCportalFrontendUi/data/batchexecute',
          'f.req=%5B%5B%5B%22r06xKb%22%2C%22%5B%5B%5C%22software%20engineer%20india%5C%22%2Cnull%2Cnull%2Cnull%2C%5C%22en-US%5C%22%2Cnull%2Cnull%2C1%5D%5D%22%2Cnull%2C%223%22%5D%5D%5D&',
          {
            params: {
              'rpcids': 'r06xKb',
              'hl': 'en-US',      
              'soc-app': '1',     
              'soc-platform': '1',
              'soc-device': '2',  
              'rt': 'c'         
            },
            headers: {
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }
    );

    let rawText = response.data;
    const lines = rawText.split('\n');
    let parsedEnvelope = null;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedEnvelope = parsed;
          break; 
        }
      } catch (e) {}
    }

    if (!parsedEnvelope?.[0]?.[2]) {
        console.log("[-] Payload is empty or format shifted. Cookie likely expired.");
        return;
    }

    const actualJobData = JSON.parse(parsedEnvelope[0][2]);
    let jobList = [];

    const extractJobs = (data) => {
        if (!Array.isArray(data)) return;
        
        if (data.length > 0 && Array.isArray(data[0]) && typeof data[0]?.[1] === 'string' && (data[0]?.[7] === 'Google' || data[0]?.[7] === 'YouTube' || data[0]?.[7] === 'Google DeepMind')) {
            if (data.length > jobList.length) {
                jobList = data; // Save the longest valid array we find
            }
        }
        
        for (const item of data) {
            extractJobs(item);
        }
    };

    extractJobs(actualJobData);

    const formattedJobs = jobList
        .filter(job => job && Array.isArray(job) && job.length > 5)
        .map(job => {
            return {
                companyName: String(job[7] || "Google"),
                role: String(job[1] || "Unknown Role"),
                location: String(job[9] || "India"),
                applyLink: String(job[2] || `https://www.google.com/about/careers/applications/jobs/results/${job[0]}`),
                salaryRaw: "N/A" 
            };
        });

    if (formattedJobs.length === 0) {
        console.log("[-] Filter dropped all jobs. Update your session cookie in the headers.");
        return;
    }

    console.log(`[+] Found ${formattedJobs.length} pristine jobs. Connecting to Database...`);

    //await mongoose.connect(MONGO_URI);
    
    let addedCount = 0;
    for (const job of formattedJobs) {
        const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
        if (!existingJob) {
            await JobPosting.create(job);
            addedCount++;
        }
    }

    console.log(`\n Success! Inserted ${addedCount} brand new jobs into your database.`);

  } catch (error) {
    console.error("Request Failed:", error.message);
  }
};

module.exports = scrapeGoogleJobs;
// scrapeGoogleJobs();

