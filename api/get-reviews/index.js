const https = require('https');

module.exports = async function (context, req) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const businessName = "Baumann Family Plumbing";
    
    // 1. Search for Place ID
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=place_id&key=${apiKey}`;

    const placeId = await new Promise((resolve, reject) => {
        https.get(searchUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.candidates && json.candidates.length > 0) {
                    resolve(json.candidates[0].place_id);
                } else {
                    reject('Place not found');
                }
            });
        }).on('error', reject);
    });

    // 2. Fetch Reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;

    const reviews = await new Promise((resolve, reject) => {
        https.get(detailsUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                resolve(json.result.reviews || []);
            });
        }).on('error', reject);
    });

    context.res = {
        status: 200,
        body: reviews
    };
};
