import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { addressify, initNavBars, endLoading, delayHrefs, geocode, waitASecond, startLoading, generatePublicId } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, db } from "../init-firebase.js";
import { collection, addDoc, GeoPoint , serverTimestamp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


let selectedFiles = [];
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    initAuthState(() => { }, () => window.location.href = "signin");
    initNavBars();
    endLoading();
    initMapLibre();
    setTimeout(() => delayHrefs(), 100);
    document.querySelector("#create_image_upload").addEventListener("change", async (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        const container = document.querySelector("#create_image_container");
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 500;
                let scaleWidth, scaleHeight;
                if (img.width > img.height) {
                    scaleWidth = maxSize;
                    scaleHeight = Math.round((img.height / img.width) * maxSize);
                } else {
                    scaleHeight = maxSize;
                    scaleWidth = Math.round((img.width / img.height) * maxSize);
                }
                const canvas = document.createElement("canvas");
                canvas.width = scaleWidth;
                canvas.height = scaleHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, scaleWidth, scaleHeight);
                const diver = document.createElement("div");
                const dataUrl = canvas.toDataURL("image/png");
                diver.classList.add("create_image-preview");
                diver.style.backgroundImage = `url(${dataUrl})`;
                container.appendChild(diver);
                diver.addEventListener("click", () => {
                    const newTab = window.open();
                    if (newTab) {
                        newTab.document.write(`<img src="${dataUrl}"/>`);
                        newTab.document.title = "Preview Image";
                    } else {
                        alert("Pop-up blocked! Allow pop-ups to view the image.");
                    }
                });

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "×";
                removeBtn.classList.add("create_image-remove_button");
                diver.appendChild(removeBtn);
                canvas.toBlob((blob) => {
                    selectedFiles.push(blob);
                    removeBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        container.removeChild(diver);
                        selectedFiles = selectedFiles.filter(f => f !== blob);
                        console.log(selectedFiles.length);
                    });
                }, 'image/png')
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    document.querySelector(".location-dropdown-content").addEventListener("submit", async (evt) => {

        evt.preventDefault();

        document.querySelector("#fetch-coordinates-button").disabled = true;
        document.querySelector("#fetch-coordinates-button").textContent = "Fetching...";
        const city = document.querySelector("#create-post-city-input").value;
        const barangay = document.querySelector("#create-post-barangay-input").value;
        const street = document.querySelector("#create-post-street-input").value;
        const query = [street, barangay, city, "Bataan"].filter(Boolean).join(", ").trim()
        const data = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        const locations = await data.json();
        console.log("Geocode locations:", locations);
        if (locations.error || locations.length == 0) {
            alert("Location not found. Please refine your search.");
        } else {
            const location = locations[0];
            mapLocation = location;
            marker.setLngLat([location.lon, location.lat]);
            map.flyTo({ center: [location.lon, location.lat], zoom: 16, pitch: 0 });
            document.querySelector("#create_location_field").textContent = [street, barangay, city, "Bataan"].filter(Boolean).join(", ") || "Select Location";
            fullAddress = addressify(location.address);
        }
        document.querySelector("#fetch-coordinates-button").disabled = false;
        document.querySelector("#fetch-coordinates-button").textContent = "Fetch Location";
        console.log(location);
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

    const theBtn = document.querySelector("#create_map-submit_button");
    theBtn.disabled = true;
    theBtn.textContent = "Please wait";
    const imgURLS = await getUploadUrls();
    const postData = {
        user_id: user.uid,
        description: theDescription,
        category: theCategory,
        media: imgURLS,
        tracker_id: null,
        created_at: serverTimestamp(),
        location: new GeoPoint(mapLocation.lat, mapLocation.lon),
        status: "PENDING",
        address_name: fullAddress.display_name || "Unknown Address",
        address_city: fullAddress.city || "Unknown City",
        address_brgy: fullAddress.brgy || "Unknown Barangay",
    };
    console.log("Post Data:", postData);
    try {
        const docRef = await addDoc(collection(db, "posts"), postData);
        console.log("Post created with ID:", docRef.id);
        alert("Post successfully created.\nPlease wait for the admin review to approve your post.");
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
}
let map;
let marker;
async function initMapLibre() {
    map = new maplibregl.Map({
        container: 'create_map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [120.5394262, 14.6779294],
        zoom: 16,
        minZoom: 10,
        maxZoom: 19,
        attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.AttributionControl(), 'top-left')
    map.getCanvas().style.cursor = 'pointer';
    marker = new maplibregl.Marker({
        draggable: true,
        color: "#FF0000",
        scale: 1.5
    })
        .setLngLat([120.5394262, 14.6779294])
        .setPopup(new maplibregl.Popup().setText('Drag me to change location!'))
        .addTo(map);
    marker.togglePopup();
    marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        console.log(`Latitude: ${lat}\nLongitude: ${lng}\nZoom: ${map.getZoom()}`);
    });
    map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
    });

    document.querySelector("#map_pinner").addEventListener("click", async (evt) => {
        const { lat, lng } = marker.getLngLat();
        evt.target.disabled = true;
        evt.target.textContent = "Fetching Location...";
        const address = await geocode(lat, lng);
        fullAddress = addressify(address.address);
        document.querySelector("#create_location_field").textContent = fullAddress.display_name;
        mapLocation = address;

        evt.target.textContent = "Wait a second.";
        await waitASecond(1.2);
        evt.target.disabled = false;
        evt.target.textContent = "Fetch Location";
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

async function getUploadUrls() {
    if (selectedFiles.length == 0) return [];
    const uploads = [];
    for (let file of selectedFiles) {
        const url = await uploadToCloudinary(file);
        uploads.push(url);
        await waitASecond(1);
    }
    return uploads;
}

export async function getSignature(public_id) {
    const response = await fetch("/api/upload_sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id })
    });

    const data = await response.json();
    return data;
}

export async function uploadToCloudinary(file) {
    const public_id = generatePublicId();
    const { signature, timestamp } = await getSignature(public_id);
    const formData = new FormData();
    console.log(timestamp);
    formData.append("file", file);
    formData.append("api_key", "456145141394984");
    formData.append("public_id", public_id);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    console.log(signature);
    const res = await fetch("https://api.cloudinary.com/v1_1/dxdmjp5zr/image/upload", {
        method: "POST",
        body: formData
    });
    if (!res.ok) {
        console.error("Upload failed, aborting app", res.status, res.statusText);
        return;
    }

    const result = await res.json();
    console.log("Upload result:", result);

    if (!result.secure_url) {
        console.error("Upload returned no URL, aborting app");
        return;
    }

    return result.secure_url;

} 

let fullAddress;

window.submitCreatePost = submitCreatePost;