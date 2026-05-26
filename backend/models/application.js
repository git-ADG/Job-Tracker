const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    companyName : { type: String, required: true },
    role : { type: String, required: true }, 
    status : {
        type: String,
        enum: ['Applied', 'OA','Interview', 'Offer', 'Rejected', 'Accepted'],
        default: 'Applied', required : true
    },
    salaryRange : {
        min : { type: Number },
        max : { type: Number },
        currency : { type: String , default: 'INR' },
    },
    location : { 
        country : { type: String },
        city : { type: String }
    },
    portalLink : { type: String },
    notes : { type: String },
    appliedDate : { type: Date, default: Date.now },
}, {timestamps : true});

module.exports = mongoose.model('Application', ApplicationSchema);