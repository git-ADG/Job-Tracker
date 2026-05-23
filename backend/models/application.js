const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    companyName : { type: String, required: true },
    role : { type: String, required: true }, 
    status : {
        type: String,
        enum: ['Applied', 'OA','Interview', 'Offer', 'Rejected', 'Accepted'],
        default: 'Applied'
    },
    salaryRange : {
        min : { type: Number },
        max : { type: Number },
        currency : { type: String , default: 'INR' },
    },
    location : { 
        country : { type: String, required: true },
        city : { type: String }
    },
    portalLink : { type: String },
    notes : { type: String },
    appliedDate : { type: Date, default: Date.now },
});

module.exports = mongoose.model('Application', ApplicationSchema);