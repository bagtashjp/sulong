import { auth } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";



onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Please log-first");
        window.location.href = "signin"
    } else {
        console.log(`Signed in as ${user.uid}`)
        document.querySelector("#loading_page").style.display = "none";
    }
});