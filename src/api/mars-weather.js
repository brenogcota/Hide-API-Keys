const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const limiter = rateLimit({
    windowMs: 30 * 1000,
    max: 10
});

const speedLimiter = slowDown({
    windowMs: 30 * 1000,
    delayAfter: 1,
    delayMs: 500
})

const router = express.Router();

const BASE_URL = 'https://api.nasa.gov/insight_weather/?';

let cacheData;
let cacheTime;

const apiKeys = new Map();
apiKeys.set('12345', true);

router.get('/', limiter, speedLimiter, (req, res, next) => {
    const apiKey = req.get('X-API-KEY');
    if(apiKeys.has(apiKey)) {
        next();
    } else {
        const error = new Error('Invalid API KEY');
        next(error);
    }
}, async (req, res, next) => {
    // in memory cache
    if(cacheTime && cacheTime > Date.now - 30 * 1000)  {
        return res.json(cacheData);
    }

    try {
        const params = new URLSearchParams({
            api_key: process.env.NASA_API_KEY,
            feedtype: 'json',
            ver: '1.0'
        });

        const { data } = await axios.get(`${BASE_URL}${params}`);
        cacheData = data;
        cacheTime = Date.now();
        data.cacheTime = cacheTime;
         
        return res.json(data);
        
    } catch (error) {
        return next(error)
    }

});

module.exports = router;
