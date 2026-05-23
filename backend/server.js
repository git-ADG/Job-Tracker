const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;

const applicationsRoutes = require('./routes/applications-routes');
const jobRoutes = require('./routes/job-routes');
const userRoutes = require('./routes/user-routes');


dotenv.config();

app.use(cors());
app.use(bodyParser.json());
app.use('/api/applications', applicationsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.json({status:'online', message: 'Welcome to the Job Tracker API' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});