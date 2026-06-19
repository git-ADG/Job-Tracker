const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis')l



dotenv.config();
const PORT = process.env.PORT || 5000;

const redisClient = createClient({
    url : process.env.REDIS_URI
});

redisClient.on('error', (err) => console.error('Redis client error', err));

(async () => {
    await redisClient.connect();
    console.log("Connected to redis")
})();

app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

const standardLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 100,
    legacyHeaders: false, 
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:standard:' 
    })
});


const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 5,
    message: { error: 'Too many attempts, please try again later.' },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:strict:' 
    })
});

const applicationsRoutes = require('./routes/applications-routes');
const jobRoutes = require('./routes/job-routes');
const userRoutes = require('./routes/user-routes');
const jobPostingRoutes = require('./routes/job-posting-routes');

const runAllScrapers = require('./scripts/runner');
const {protect} = require('./middleware/auth-middleware');

app.use(cors(
    {
        origin : ['http://localhost:5173', 'https://jobtrackerfrontend-fe1a.onrender.com'],
        credentials: true
    }
));

app.use(bodyParser.json());

app.use(standardLimiter);

app.use('/api/users/login', strictLimiter);
app.use('/api/users/register', strictLimiter);
app.use('/api/admin/force-scrape', strictLimiter);

app.use('/api/applications', applicationsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-posting', jobPostingRoutes);


const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.json({status:'online', message: 'Welcome to the Job Tracker API' });
});

//admin god mode controls
app.post('/api/admin/force-scrape', protect , async (req, res) => {
    try {
        console.log(`[ADMIN] Manual scrape triggered by user: ${req.user.id}`);

        runAllScrapers(); 

        res.status(200).json({ 
            success: true, 
            message: "Global Scrape Sequence initiated. The database is being refreshed." 
        });

    } catch (err) {
        console.error("Manual Scrape Error:", err.message);
        res.status(500).json({ error: "Failed to initiate scraper." });
    }
});

cron.schedule('0 8,20 * * *', () => {
    console.log("[CRON] Triggering Bi-Daily Scrape Sequence...");
    runAllScrapers();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});