import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, geocode, waitASecond, startLoading } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, db } from "../init-firebase.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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
});

let mapLocation;
async function submitCreatePost() {
    const user = auth.currentUser;
    if (!user) {
        startLoading()
        setTimeout(() => {
            window.location.href = "signin"
        }, 800)
        return;
    }
    if (!mapLocation) {
        alert("You didn't specify a location. Please click [Fetch Location] first.");
        return;
    }
    const theDescription = document.querySelector("#create_map-description").value;
    const theCategory = document.querySelector("#create_map_tags_list").value;
    if (theCategory == "tags_null") {
        alert("Please add a Tag.");
        return;
    }
    if (theDescription.length == 0) {
        alert("Please add a description.");
        return;
    }
    const postData = {
        user_id: user.uid,
        description: theDescription,
        category: theCategory,
        media: null,
        tracker_id: null,
        created_at: new Date(),
        lat: +mapLocation.lat,
        lon: +mapLocation.lon
    };
    const theBtn = document.querySelector("#create_map-submit_button");
    theBtn.disabled = true;
    theBtn.textContent = "Please wait";
    try {
        const docRef = await addDoc(collection(db, "posts"), postData);
        console.log("Post created with ID:", docRef.id);
        alert("Post successfully created.");
        startLoading();
        setTimeout(() => {
            window.location.href = "feed"
        }, 800)
    } catch (err) {
        console.error("Error creating post:", err);
        alert("Error creating post:" + err.message);
         const theBtn = document.querySelector("#create_map-submit_button");
        theBtn.disabled = false;
        theBtn.textContent = "Submit";
    }
    /*
    const token = await user.getIdToken();
    if (!token) {
        alert("Failed to get token. Please report this as a bug.");
    }
    const response = await fetch("/api/create-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ data: "hello" }),
    });

    const result = await response.json();
    console.log(result);
  */

}


// JS
async function initMapLibre() {
    const map = new maplibregl.Map({
        container: 'create_map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [120.540962, 14.678921],
        zoom: 16,
        minZoom: 10,
        maxZoom: 19,
        attributionControl: false
    });
    map.setPitch(60);
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.AttributionControl(), 'top-left')
    const marker = new maplibregl.Marker({
        draggable: true,
        color: "#FF0000",
        scale: 1.5
    })
        .setLngLat([120.540962, 14.678921])
        .setPopup(new maplibregl.Popup().setText('Drag me to change location!'))
        .addTo(map);
    marker.togglePopup();
    marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        console.log(`Latitude: ${lat}\nLongitude: ${lng}\nZoom: ${map.getZoom()}`);
    });
    document.querySelector("#map_pinner").addEventListener("click", async (evt) => {
        const { lat, lng } = marker.getLngLat();
        evt.target.disabled = true;
        evt.target.textContent = "Fetching Location...";
        const address = await geocode(lat, lng);
        document.querySelector("#create_location_field").textContent = address.display_name
        mapLocation = address;
        console.log(mapLocation.lat);
        console.log(mapLocation.lon);
        
        evt.target.textContent = "Wait a second.";
        await waitASecond(1.2);
        evt.target.disabled = false;
        evt.target.textContent = "Fetch Location";
        const res = await fetch("/api/sign");
        console.log(res.body);
    });

    const styles = {
        "3D": 'https://tiles.openfreemap.org/styles/liberty',
        "Bright": 'https://tiles.openfreemap.org/styles/bright',
        "CartoDB": 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
        console.log(JSON.stringify(await geocode(lat, lng)))

        evt.target.textContent = "Wait a second."
        await waitASecond(1.2);
        evt.target.disabled = false;
        evt.target.textContent = "Fetch Location"


    })


}


window.submitCreatePost = submitCreatePost;