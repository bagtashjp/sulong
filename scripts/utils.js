import { auth, getNotifications } from "./init-firebase.js";

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


export async function waitASecond(sec) {
    setTimeout(() => { return }, (sec / 1000));
}

export async function searchGeo({ city, barangay, street }) {
    const parts = [street, barangay, city, "Bataan", "Philippines"].filter(Boolean);
    const query = encodeURIComponent(parts.join(", "));

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);

    const res = await fetch(url, {
        headers: {
            "User-Agent": "SulongApp/1.0 (hjpbagtas@bpsu.edu.ph)"
        }
    });
    const data = await res.json();
    console.log(data);

    return data;
}


export function generatePublicId() {
    return crypto.randomUUID();
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
export async function initNotifications() {
    const alertBtn = document.querySelector("#alert-btn");
    alertBtn.style.display = "block";
    alertBtn.onclick = async () => {
        const notifBar = document.querySelector(".notif_bar");
        if (notifBar.style.right === "0px") {
            notifBar.style.right = "-350px";
            return;
        }
        notifBar.style.right = "0px";
    }
    const notifs = await getNotifications();
    notifs.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    const notifContainer = document.querySelector(".notif_content");
    notifContainer.replaceChildren();
    for (const notif of notifs) {
        const notifElem = document.createElement("a");
        notifElem.classList.add("notif_item");
        const date = notif.timestamp.toDate();
        const {body, href} = buildNotifBody(notif);
        notifElem.innerHTML = `
            <a class="notif_item_body">${body||""}</a>
            <span class="notif_item_date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
            `;
        notifElem.href = href || "#";
        notifContainer.appendChild(notifElem);
    }

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

export async function summonToast(message, duration = 3000) {
    const toast = document.createElement("div");

    Object.assign(toast.style, {
        position: "fixed",
        bottom: "-20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgb(var(--color-base-background))",
        color: "rgb(var(--color-base-font))",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "14px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        opacity: 0,
        transition: "bottom 0.5s ease, opacity 0.5s ease",
    });

    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.bottom = "20px";
        toast.style.opacity = 1;
    }, 100);

    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.bottom = "-20px";
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, duration);
    
}

export async function summonRightToast(html, href = null, duration = 5000) {
    // --- Element Creation ---
    const toast = document.createElement(href ? "a" : "div");
    toast.className = 'custom-right-toast-container';

    // Configure as a link if href is provided
    if (href) {
        toast.href = href;
        toast.target = "_blank";
    }

    // Add a close button
    const closeButton = document.createElement("span");
    closeButton.innerHTML = "&#x2715;"; // X mark
    closeButton.className = 'custom-toast-close';

    // Set the message content (supports multi-line HTML)
    toast.innerHTML = `<div class="custom-toast-message">${html}</div>`;
    toast.appendChild(closeButton);

    // --- Styling (Upper Right Corner) ---
    Object.assign(toast.style, {
        position: "fixed",
        top: "101vh", // Initial position (off-screen)
        right: "20px", // Anchor to the right side
        left: "auto",
        transform: "none",
        maxWidth: "350px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "color-mix(in srgb, var(--color-primary), gray 30%)",
        color: "black",
        padding: "10px 15px",
        borderRadius: "8px",
        fontSize: "14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
        zIndex: 9999,
        opacity: 0,
        // Update transition property for top and opacity
        transition: "top 0.5s ease, opacity 0.5s ease",
        textDecoration: href ? "none" : "initial",
        cursor: "pointer",
    });

    // Style for the close button
    Object.assign(closeButton.style, {
        marginLeft: "15px",
        fontSize: "16px",
        cursor: "pointer",
        flexShrink: 0,
    });

    // Style for the message container inside the toast
    const messageContainer = toast.querySelector('.custom-toast-message');
    if (messageContainer) {
        Object.assign(messageContainer.style, {
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            paddingRight: "10px",
            flexGrow: 1,
        });
    }

    // --- Functionality ---

    // 1. Show the toast (slide in from the top)
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.top = "65px"; // Final visible position (upper right)
        toast.style.opacity = 1;
    }, 100);

    // 2. Define the hide function
    const hideToast = () => {
        toast.style.opacity = 0;
        toast.style.top = "-20px";
        closeButton.removeEventListener("click", closeButtonHandler);
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    };

    // 3. Auto-hide timeout
    const hideTimeout = setTimeout(hideToast, duration);

    // 4. Close button handler
    const closeButtonHandler = (e) => {
        e.stopPropagation(); // Prevents link navigation if applicable
        clearTimeout(hideTimeout);
        hideToast();
    };
    closeButton.addEventListener("click", closeButtonHandler);

    // If it's a link, prevent the close button from triggering the link navigation
    if (href) {
        closeButton.addEventListener("click", (e) => e.preventDefault());
    }
}

export function addressify(addr) {
    let city = addr.city || addr.town || addr.municipality || addr.county || "";
    let brgy = addr.suburb || addr.village || addr.neighbourhood || "";

    let streetParts = [];

    // Order: street > road > block > quarter > neighbourhood > village
    if (addr.street) streetParts.push(addr.street);
    if (addr.road && addr.road !== addr.street) streetParts.push(addr.road);
    if (addr.block && addr.block !== brgy) streetParts.push(addr.block);
    if (addr.quarter && addr.quarter !== brgy) streetParts.push(addr.quarter);
    if (addr.neighbourhood && addr.neighbourhood !== brgy) streetParts.push(addr.neighbourhood);
    if (addr.village && addr.village !== brgy && addr.village !== addr.neighbourhood) streetParts.push(addr.village);

    let street = streetParts.join(", ");

    // build display name
    let parts = [];
    if (street) parts.push(street);
    if (brgy) parts.push(brgy);
    if (city) parts.push(city);
    parts.push("Bataan"); // always add province/state at the end

    let displayName = parts.join(", ");
    console.log("Addressify:", displayName);
    return {
        display_name: displayName.trim(),
        street: street.trim(),
        brgy: brgy.trim(),
        city: city.trim()
    };
}
export function buildNotifBody(notif) {
    let body;
    let href;
    if (notif.type === "POST_APPROVED") {
        body = `Your post <b>"${stringShorten(notif.post_description)}"</b> has been approved!<br/>`;
        href = `/post?id=${encodeURIComponent(notif.post_id)}`;
    } else if (notif.type === "NEW_COMMENT") {
        body = `<b>New comment</b> on post: "<b>${stringShorten(notif.post_description)}</b>"<br/>`;
        href = `/post?id=${encodeURIComponent(notif.post_id)}`;
    } else if (notif.type === "NEW_PROGRESS") {
        body = `<b>New progress update</b> on post: "<b>${stringShorten(notif.post_description)}</b>"<br/>`;
        href = `/post?id=${encodeURIComponent(notif.post_id)}`;
    } else if (notif.type === "POST_REJECTED") {
        body = `Your post <b>"${stringShorten(notif.post_description)}"</b> has been rejected.<br/>Reason: <b>${notif.reason || "No reason provided."}</b>`;
        href = `#`;
    } else if (notif.type === "POST_RESOLVED") {
        body = `Your post <b>"${stringShorten(notif.post_description)}"</b> has been resolved.<br/>`;
        href = `/post?id=${encodeURIComponent(notif.post_id)}`;
    }
    return {body, href};
}
function stringShorten(str, maxLength = 20) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

export function convertSimilarity(cosineDistance) {
  const D = cosineDistance;
  let percentage;

  // --- Segment 1: High Similarity (0.0 to 0.3) ---
  // This segment is now less steep: 100% (at 0.0) -> 80% (at 0.3)
  // Slope = (80 - 100) / (0.3 - 0.0) = -20 / 0.3 = -66.67
  if (D <= 0.3) {
    percentage = (-20 / 0.3) * D + 100;

  // --- Segment 2: Steep Cliff (0.3 to 0.5) ---
  // This segment is now steeper: 80% (at 0.3) -> 0% (at 0.5)
  // Slope = (0 - 80) / (0.5 - 0.3) = -80 / 0.2 = -400
  } else if (D > 0.3 && D <= 0.5) {
    // We can solve for the equation y = -400*D + b
    // Using point (0.5, 0): 0 = -400*(0.5) + b -> b = 200
    percentage = -400 * D + 200;

  // --- Catch-all: Distances > 0.5 ---
  } else {
    percentage = 0;
  }

  // Ensure the result is within the 0 to 100 range
  return Math.max(0, Math.min(100, percentage));
}