const express = require('express');
const router = express.Router();
const Application = require('../models/application');

const { protect } = require('../middleware/auth-middleware');

router.use(protect);

//CREATE
router.post('/', async (req, res) => {
    try{
        const applicationData = { ...req.body, user: req.user.id };
        const newApplication = new Application(applicationData);
        const savedApplication = await newApplication.save();
        res.status(201).json(savedApplication);
    }catch(err){
        res.status(400).json({ error: 'Failed to create application', details: err.message });
    }
});

//READ ALL
router.get('/', async (req, res) => {
    try{
        console.log("Backend received request for User ID:", req.user.id);
        const applications = await Application.find({ user: req.user.id }).sort({ appliedDate: -1 });
        res.status(200).json(applications);
    }catch(err){
        res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
    }
});

//READ ONE
router.get('/:id', async (req, res) => {
    try{
        const application = await Application.findById(req.params.id);
        if(!application){
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json(application);
    }catch(err){
        res.status(500).json({ error: 'Failed to fetch application', details: err.message });
    }
});

//UPDATE
router.put('/:id', async (req, res) => {
    try{
        const updatedApplication = await Application.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if(!updatedApplication){
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json(updatedApplication);
    }catch(err){
        res.status(400).json({ error: 'Failed to update application', details: err.message });
    }
});

//UPDATE STATUS
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;

        const validStatuses = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Accepted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status column." });
        }

        let application = await Application.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({ error: "Application not found." });
        }

        if (application.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Not authorized to modify this application." });
        }

        application.status = status;
        await application.save();

        res.json({ success: true, application });

    } catch (err) {
        console.error("Status Update Error:", err.message);
        res.status(500).send("Server Error");
    }
});

//DELETE
router.delete('/:id', async (req, res) => {
    try{
        const deletedApplication = await Application.findByIdAndDelete(req.params.id);
        if(!deletedApplication){
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json({ message: 'Application deleted successfully' });
    }catch(err){
        res.status(500).json({ error: 'Failed to delete application', details: err.message });
    }
});

module.exports = router;