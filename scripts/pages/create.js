import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, geocode, waitASecond } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    initAuthState(() => { }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    endLoading();
    initMapLibre();
    setTimeout(() => {
        delayHrefs(), 100
    });
})

function initLeafletMap() {
    var map = L.map("create_map").setView([14.678921, 120.540962], 13);
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 10
    }).addTo(map);

    var carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>',
        maxZoom: 19,
        minZoom: 10
    });
    L.control.layers({
        "OpenStreetMap": osm,
        "CartoDB": carto
    }).addTo(map);

    const marker = L.marker([14.678921, 120.540962], { draggable: true }).addTo(map)
    marker.bindPopup('Drag me to change location!').openPopup();
    marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        console.log(`Latitude: ${lat}\nLongitude: ${lng}\nZoom: ${map.getZoom()}`)
    })
    document.querySelector("#map_pinner").addEventListener("click", async (evt) => {
        const { lat, lng } = marker.getLatLng();
        evt.target.disabled = true;
        evt.target.textContent = "Fetching Location..."
        alert(JSON.stringify(await geocode(lat, lng)))

        evt.target.textContent = "Wait a second."
        await waitASecond(1.2);
        evt.target.disabled = false;
        evt.target.textContent = "Fetch Location"
    })
}

// JS
async function initMapLibre() {
    // Initialize the map
    const map = new maplibregl.Map({
        container: 'create_map',
        style: 'https://tiles.openfreemap.org/styles/bright', // default style
        center: [120.540962, 14.678921], 
        zoom: 10,
        minZoom: 10,
        maxZoom: 19
    });

    // Add zoom & rotation controls
    map.addControl(new maplibregl.NavigationControl());

    // Add a draggable marker
    const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([120.540962, 14.678921])
        .setPopup(new maplibregl.Popup().setText('Drag me to change location!'))
        .addTo(map);

    marker.togglePopup(); // open popup on load

    // Log coordinates when dragging ends
    marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        console.log(`Latitude: ${lat}\nLongitude: ${lng}\nZoom: ${map.getZoom()}`);
    });

    // Fetch address when button is clicked
    document.querySelector("#map_pinner").addEventListener("click", async (evt) => {
        const { lat, lng } = marker.getLngLat();
        evt.target.disabled = true;
        evt.target.textContent = "Fetching Location...";

        const address = await geocode(lat, lng); // your geocode function
        alert(JSON.stringify(address));

        evt.target.textContent = "Wait a second.";
        await waitASecond(1.2);
        evt.target.disabled = false;
        evt.target.textContent = "Fetch Location";
    });

    // Optional: switch map style (simulates layer control)
    const styles = {
        
        "Bright": 'https://tiles.openfreemap.org/styles/bright',
        "CartoDB": 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        "3D": 'https://tiles.openfreemap.org/styles/liberty',
        "Dark Mode": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        
    };

    const styleSelector = document.createElement('select');
    styleSelector.id = "map_style_selector";
    for (const [name, url] of Object.entries(styles)) {
        const option = document.createElement('option');
        option.value = url;
        option.textContent = name;
        styleSelector.appendChild(option);
    }
    document.querySelector("#create_map").appendChild(styleSelector);

    styleSelector.addEventListener('change', (e) => {
        map.setStyle(e.target.value);
    });
}


export function logout() {
    auth.signOut();
}
