const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const JobPosting = require('../models/job-posting');

dotenv.config({path : path.join(__dirname, '../.env')});

const MONGO_URI = process.env.MONGO_URI;
console.log("Database URI targeting:", MONGO_URI);

const scrapeGoogleJobs = async () => {
  console.log("Initiating stealth batchexecute request to Google...");

  try {
    const response = await axios.post(
      'https://www.google.com/about/careers/applications/_/HiringCportalFrontendUi/data/batchexecute',
      'f.req=%5B%5B%5B%22r06xKb%22%2C%22%5B%5B%5C%22software%20engineer%20india%5C%22%2Cnull%2Cnull%2Cnull%2C%5C%22en-US%5C%22%2Cnull%2Cnull%2C1%5D%5D%22%2Cnull%2C%223%22%5D%5D%5D&',
      {
        params: {
          'rpcids': 'r06xKb',
          'source-path': '/about/careers/applications/jobs/results',
          'f.sid': '-3896658394146968723',
          'bl': 'boq_corp-hiring-boq-cportal-frontend_20260526.06_p0',
          'hl': 'en-US',
          'soc-app': '1',
          'soc-platform': '1',
          'soc-device': '2',
          '_reqid': '3559329',
          'rt': 'c'
        },
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'origin': 'https://www.google.com',
          'priority': 'u=1, i',
          'referer': 'https://www.google.com/',
          'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
          'sec-ch-ua-arch': '""',
          'sec-ch-ua-bitness': '"64"',
          'sec-ch-ua-form-factors': '"Desktop"',
          'sec-ch-ua-full-version': '"148.0.7778.179"',
          'sec-ch-ua-full-version-list': '"Chromium";v="148.0.7778.179", "Google Chrome";v="148.0.7778.179", "Not/A)Brand";v="99.0.0.0"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-model': '"Nexus 5"',
          'sec-ch-ua-platform': '"Android"',
          'sec-ch-ua-platform-version': '"6.0"',
          'sec-ch-ua-wow64': '?0',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36',
          'x-browser-channel': 'stable',
          'x-browser-copyright': 'Copyright 2026 Google LLC. All Rights Reserved.',
          'x-browser-validation': '+f/6R40gd6znZQYfwfSnAdnLwLk=',
          'x-browser-year': '2026',
          'x-same-domain': '1',
          'cookie': '_ga=GA1.2-3.46793962.1779965927; _gat_UA-18025-1=1; _gat_UA-45521908-5=1; _ga_41NEC9ZD62=GS2.2-3.s1779965926$o1$g1$t1779967497$j9$l0$h0; _ga_KZKKTZQKX5=GS2.2-3.s1779965927$o1$g1$t1779967497$j9$l0$h0; _ga=GA1.2-3.46793962.1779965927; _gid=GA1.2-3.665841516.1779965927; NID=531=G3MSpmRpkI6o_mdBxtzkB_WvZH_5gCdrdJUnbrlGH6gLw5Lv2NCb4UACQv8M5_Av2ryaex2bqESVDIinucv8Bxuuepr4KsH6sC2E8PvDrNRboMOTezOBnI44mGrOk5yvs_N5XnkPEHLkVHMPBRklPkp4Jt6BIVpdG5QJahq5LYdfaTWEry53WGwtIENHziN24VmJ8hMuezGu; OTZ=8627699_34_34__34_'
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

    // THE FIX: Recursive Array Hunter
    // This digs through Google's nested arrays to find the exact list of jobs
    const extractJobs = (data) => {
        if (!Array.isArray(data)) return;
        
        // If it looks like a list of jobs (index 1 is a string title, index 7 is Company)
        if (data.length > 0 && Array.isArray(data[0]) && typeof data[0]?.[1] === 'string' && (data[0]?.[7] === 'Google' || data[0]?.[7] === 'YouTube')) {
            if (data.length > jobList.length) {
                jobList = data; // Save the longest valid array we find
            }
        }
        
        // Keep digging deeper
        for (const item of data) {
            extractJobs(item);
        }
    };

    extractJobs(actualJobData);

    // THE FIX: Precise Index Mapping
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

    await mongoose.connect(MONGO_URI);
    
    let addedCount = 0;
    for (const job of formattedJobs) {
        const existingJob = await JobPosting.findOne({ applyLink: job.applyLink });
        if (!existingJob) {
            await JobPosting.create(job);
            addedCount++;
        }
    }

    console.log(`\n🎉 Success! Inserted ${addedCount} brand new jobs into your database.`);

  } catch (error) {
    console.error("Request Failed:", error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
  }
};

scrapeGoogleJobs();