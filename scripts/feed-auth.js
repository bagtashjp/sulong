import { auth } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "signin"
    } else {
        console.log(`Signed in as ${user.uid}`)
        document.querySelector("#loading_page").style.display = "none";
    }
});

function logout() {
    auth.signOut();
}
function darkmode(evt) {
    const els = document.documentElement.style;
    if (evt.currentTarget.innerText == "Dark Mode") {
         els.setProperty("--color-base-background", "#2C2C2C")
         els.setProperty("--color-base-font", "white")
         els.setProperty("--filter-dark-mode", 1);
         
         evt.currentTarget.innerText = "Light Mode"
    } else {
         els.setProperty("--color-base-background", "white")
         els.setProperty("--color-base-font", "black")
         els.setProperty("--filter-dark-mode", 0);
         
         evt.currentTarget.innerText = "Dark Mode"
    }
}

window.darkmode = darkmode;
window.logout = logout;
