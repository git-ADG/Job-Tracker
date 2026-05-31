const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/search', async (req, res) => {
    const {query, page} = req.query;
    try{
        const options = {
            method: 'GET',
            url: 'https://jsearch.p.rapidapi.com/search',
            params: {
            query: query || 'Software Engineer fresher India',
            page: page || '1',
            num_pages: '1',
            date_posted: 'month'
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        };
        //console.log("Sending options to RapidAPI:", options.params);
        const response = await axios.request(options);
        //console.log(response.data.data);
        res.status(200).json(response.data.data);
    }catch(err){
        console.error('Error fetching jobs:', err.message);
        res.status(500).json({ error: 'Failed to fetch jobs'});
    }
});

module.exports = router;