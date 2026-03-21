const https = require('https');

module.exports = async function (context, req) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    context.log("Function triggered. API Key exists:", !!apiKey);
    
    if (!apiKey) {
        context.res = { status: 500, body: "API Key missing in environment." };
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
                    const json = JSON.parse(data);
                    context.log("Search result:", JSON.stringify(json));
                    if (json.candidates && json.candidates.length > 0) {
                        resolve(json.candidates[0].place_id);
                    } else {
                        reject('Place not found: ' + JSON.stringify(json));
                    }
                });
            }).on('error', (e) => reject(e.message));
        });

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;

        const reviews = await new Promise((resolve, reject) => {
            https.get(detailsUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const json = JSON.parse(data);
                    context.log("Details result:", JSON.stringify(json));
                    resolve(json.result ? json.result.reviews : []);
                });
            }).on('error', (e) => reject(e.message));
        });

        context.res = { status: 200, body: reviews };
    } catch (error) {
        context.log.error("Function error:", error);
        context.res = { status: 500, body: "Internal Server Error: " + error };
    }
};
