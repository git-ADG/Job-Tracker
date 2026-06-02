const mongoose = require('mongoose');

//schema for job fetched from rapidAPI
//not in use in current prod, only used during dev phase
const fetchedJobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true },
    companyName : { type: String, required: true },
    type : { 
        type: String,
        enum: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Contract'],
        default: 'Full-time' 
    },
    role : { type: String, required: true },  
    location : { 
        country : { type: String, required: true },
        city : { type: String }
    },  
    description : { type: String },
    skillsRequired : [ { type: String } ],
    experienceLevel : { 
        isFresher : { type: Boolean, default: false },
        yearsRequired : { type: Number, default: 0 }
    },
    salary : {
        amount : { type: Number },
        currency : { type: String , default: 'INR' },
        isStipend : { type: Boolean, default: false }
    },
    portalLink : { type: String, required: true },
    lastDateToApply : { type: Date },
    fetchedAt : { type: Date, default: Date.now }
},
{ timestamps: true }
);

fetchedJobSchema.index({
    'location.country' : 1,
    'experienceLevel.isFresher' : 1,
});

module.exports = mongoose.model('FetchedJob', fetchedJobSchema);