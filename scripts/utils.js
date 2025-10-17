import { auth } from "./init-firebase.js";

export function initNavBars() {
    document.querySelector("#logout_btn").addEventListener("click", logout);
}

function logout() {
    auth.signOut();
}

export function endLoading() {
    document.body.classList.remove("loading_control");
    document.querySelector("#loading_page").style.top = "100%"
    /*
    document.querySelector("#loading_page").classList.remove("loading_starter");
    document.querySelector("#loading_page").classList.add("loading_ender");*/
}

export function startLoading() {
    document.querySelector("#loading_page").style.top = "0%"
    document.body.classList.add("loading_control");
    /*
    document.querySelector("#loading_page").classList.add("loading_starter");
    document.querySelector("#loading_page").classList.remove("loading_ender");*/
}

export function delayHrefs() {
    Array.from(document.getElementsByTagName("a")).forEach(a => {
        const href = a.getAttribute("href");
        if (href.startsWith("#")) return;
        a.addEventListener("click", (evt) => {
            evt.preventDefault();
            startLoading();
            setTimeout(() => {
                window.location.href = href
            }, 800)
        })
    })
}

export async function geocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'MyLeafletApp/1.0 (myemail@example.com)'
        }
    });
    const data = await res.json();
    console.log("Location Data:", data);
    return data || "Unknown location";
}


export async function waitASecond(sec) {
    setTimeout(() => { return }, (sec / 1000));
}

export async function searchGeo({ city, barangay, street }) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('country', 'Philippines');
    url.searchParams.set('state', 'Bataan');
    url.searchParams.set('city', city);
    url.searchParams.set('suburb', barangay)
    url.searchParams.set('street', street);
    url.searchParams.set('addressdetails', '1');
    const res = await fetch(url, {
        headers: {
            "User-Agent": "SulongApp/1.0 (hjpbagtas@bpsu.edu.ph)"
        }
    })
    const data = await res.json();
    console.log(data);

}

export function generatePublicId() {
  return crypto.randomUUID(); 
}

const GEOAPIFY_BASE = "https://maps.geoapify.com/v1/staticmap";
const API_KEY = "2d543afb501542e2baf2164ff8af23c9"; 

export function buildStaticMapUrl({
  centerLon,
  centerLat,
  zoom = 16,
  width = 1200,
  height = 700,
  markers = []
}) {
  // center lonlat part
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
    + `&apiKey=${API_KEY}`;
  
  return url;
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
    const public_id = crypto.randomUUID();
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