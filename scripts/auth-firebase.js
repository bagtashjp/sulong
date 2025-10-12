import { auth } from "./init-firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

export function initAuthState(userLoggedIn, userLoggedOut) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            /*
            Omitting this since log out button is already created, instead user will just redirect to feed.
            const confirmRedirect = confirm (
                "User is already signed in. You'll be redirected to home page.\n" +
                "If you want to test again, [Cancel] will sign out the user."
            );
            */
            userLoggedIn?.();
        } else {
            console.log("No user is signed in.");
            userLoggedOut?.();
        }
    });
}

export function isUserSignedIn() {
    
}