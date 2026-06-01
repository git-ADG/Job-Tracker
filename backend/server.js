const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;

const applicationsRoutes = require('./routes/applications-routes');
const jobRoutes = require('./routes/job-routes');
const userRoutes = require('./routes/user-routes');
const jobPostingRoutes = require('./routes/job-posting-routes');

const runAllScrapers = require('./scripts/runner');

dotenv.config();

app.use(cors(
    {
        origin : ['http://localhost:5173', 'https://jobtrackerfrontend-fe1a.onrender.com'],
        credentials: true
    }
));
app.use(bodyParser.json());
app.use('/api/applications', applicationsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-posting', jobPostingRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.json({status:'online', message: 'Welcome to the Job Tracker API' });
});

cron.schedule('0 8,20 * * *', () => {
    console.log("⏰ [CRON] Triggering Bi-Daily Scrape Sequence (IST)...");
    runAllScrapers();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});