// Worker Entry Point (index.js or worker.js)

// Configuration for the third-party map service
const GEOAPIFY_BASE = 'https://api.geoapify.com/v1/staticmap';
const DEFAULT_ZOOM = 16;
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 700;

// Helper function to build the Geoapify URL (modified from your original client-side function)
function buildStaticMapUrl(requestUrl, env) {
    const urlParams = new URLSearchParams(requestUrl.search);
    const centerLon = urlParams.get('lon');
    const centerLat = urlParams.get('lat');
    const zoom = urlParams.get('zoom') || DEFAULT_ZOOM;
    const width = urlParams.get('width') || DEFAULT_WIDTH;
    const height = urlParams.get('height') || DEFAULT_HEIGHT;
    const markers = [{}];

    const center = `lonlat:${centerLon},${centerLat}`;

    // markers part
    const markerStrings = markers.map(marker => {
        const {
            lon = centerLon, lat = centerLat,
            type = "material",
            color = "#4c905a",
            size = "medium",
            icon = "",
            icontype = "awesome"
        } = marker;
        let str = `lonlat:${lon},${lat};type:${type};color:${encodeURIComponent(color)};size:${size}`;
        if (icon) {
            str += `;icon:${icon}`;
        }
        if (icontype) {
            str += `;icontype:${icontype}`;
        }
        return str;
    });

    const markerParam = markerStrings.length > 0
        ? `&marker=${markerStrings.join("|")}`
        : "";

    const url = `${GEOAPIFY_BASE}?style=osm-bright-smooth&width=${width}&height=${height}`
        + `&center=${center}&zoom=${zoom}`
        + markerParam
        + `&apiKey=${env.GEOAPIFY_API_KEY_A}`;

    return url;
}

// Main Fetch Handler
export async function onRequest(context) {
    const { request, env } = context;
    try {
        // 1. Generate the map provider URL, hiding the API Key
        const mapUrl = buildStaticMapUrl(new URL(request.url), env);

        // 2. Fetch the image from the third-party service
        const response = await fetch(mapUrl);
        if (!response.ok) {
            console.log('Map service error:', response.body);
            return new Response(`Map service error: ${response.statusText}`, { status: response.status });
        }

        // 3. Clone the response and set aggressive caching headers
        const newResponse = new Response(response.body, response);

        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        // Set an ETag based on the unique map URL for optional revalidation
        newResponse.headers.set('ETag', `"${mapUrl.length}-${crypto.subtle.digest('SHA-1', new TextEncoder().encode(mapUrl))}"`);

        return newResponse;
    } catch (error) {
        console.error('Worker error:', error.message);
        return new Response(`Worker error: ${error.message}`, { status: 500 });
    }
}
