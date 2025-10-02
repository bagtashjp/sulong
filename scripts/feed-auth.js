import { auth } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ignite } from "../script.js";
import "../script.js";
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
window.logout = logout;
