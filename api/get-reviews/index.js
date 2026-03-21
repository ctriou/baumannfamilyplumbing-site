const https = require('https');

module.exports = async function (context, req) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    // Explicit debug check for the environment variable
    if (!apiKey) {
        context.res = { 
            status: 500, 
            body: "DEBUG ERROR: GOOGLE_PLACES_API_KEY environment variable is NOT SET in Azure App Settings." 
        };
        return;
    }

    const businessName = "Baumann Family Plumbing";
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=place_id&key=${apiKey}`;

    try {
        const placeId = await new Promise((resolve, reject) => {
            https.get(searchUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.status === "OK" && json.candidates && json.candidates.length > 0) {
                            resolve(json.candidates[0].place_id);
                        } else {
                            reject('Google Search Error: ' + JSON.stringify(json));
                        }
                    } catch (e) {
                        reject('JSON Parse Error: ' + e.message);
                    }
                });
            }).on('error', (e) => reject('HTTPS Request Error: ' + e.message));
        });

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;

        const reviews = await new Promise((resolve, reject) => {
            https.get(detailsUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.status === "OK") {
                            resolve(json.result ? json.result.reviews : []);
                        } else {
                            reject('Google Details Error: ' + JSON.stringify(json));
                        }
                    } catch (e) {
                        reject('JSON Parse Error: ' + e.message);
                    }
                });
            }).on('error', (e) => reject('HTTPS Request Error: ' + e.message));
        });

        context.res = { status: 200, body: reviews };
    } catch (error) {
        context.res = { status: 500, body: "Internal Server Error: " + error };
    }
};
