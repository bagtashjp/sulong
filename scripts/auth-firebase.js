import { auth, getCurrentUserData } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

export function initAuthState(userLoggedIn, userLoggedOut) {

    onAuthStateChanged(auth, async (user) => {
        if (user) {

            if (!window.location.pathname.endsWith("signin")) {
                auth.currentUser.getIdTokenResult(true).then((idTokenResult) => {
                    const role = idTokenResult.claims.role;
                    const lndash = document.querySelector(".lndash");
                    if (role == "ADMIN") {
                        if (lndash) lndash.style.display = "flex";
                    } else {
                        if (lndash) lndash.style.display = "none";
                    }
                });
                const container = document.querySelector("#switch-to-pic");
                container.replaceChildren();
                const image = document.createElement("a");
                image.href = "";
                const udd = await getCurrentUserData();
                console.log(udd);
                image.style.backgroundImage = `url(${udd.avatar})`;
                image.classList.add("nav_profile_pic");
                container.appendChild(image);
            }
            await userLoggedIn?.();
        } else {
            console.log("No user is signed in.");
            userLoggedOut?.();
        }
    });
}

export function isUserSignedIn() {

}