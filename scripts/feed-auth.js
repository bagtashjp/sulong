import { auth } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


let justOnce = true;
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "signin"
    } else {
        console.log(`Signed in as ${user.uid}`)
        document.querySelector("#loading_page").style.display = "none";
        if (justOnce) {
            ignite();
        }
        justOnce = false;
    }
});

function logout() {
    auth.signOut();
}
let isDark = false;
function darkmode(evt) {
    const els = document.documentElement.style;
    if (!isDark) {
         els.setProperty("--color-base-background", "#2C2C2C")
         els.setProperty("--color-base-font", "white")
         els.setProperty("--filter-dark-mode", 1);
         evt.currentTarget.innerText = "Light Mode"
         localStorage.setItem("color-scheme", "dark");
         isDark = true;
    } else {
         els.setProperty("--color-base-background", "white")
         els.setProperty("--color-base-font", "black")
         els.setProperty("--filter-dark-mode", 0);
         evt.currentTarget.innerText = "Dark Mode"
         localStorage.setItem("color-scheme", "light");
         isDark = false;
    }
}

function ignite() {
    if (localStorage.getItem("color-scheme") == "dark") {
        document.querySelector("#darkmoder").click();
    }
}


window.darkmode = darkmode;
window.logout = logout;
