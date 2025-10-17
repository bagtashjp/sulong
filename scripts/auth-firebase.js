import { auth, doesUserExist, getCurrentUserData } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

export function initAuthState(userLoggedIn, userLoggedOut) {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await userLoggedIn?.();
            if (window.location.pathname.endsWith("signin")) return;
            const container = document.querySelector("#switch-to-pic");
            container.replaceChildren();
            const image = document.createElement("a");
            image.href = "";
            const udd = await getCurrentUserData();
            console.log(udd);
            image.style.backgroundImage = `url(${udd.avatar})`;
            image.classList.add("nav_profile_pic");
            container.appendChild(image);
        } else {
            console.log("No user is signed in.");
            userLoggedOut?.();
        }
    });
}

export function isUserSignedIn() {

}