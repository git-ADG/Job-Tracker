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
        const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });
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