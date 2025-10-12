import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initAuthState } from "../auth-firebase.js";
import { auth } from "../init-firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { endLoading, startLoading, delayHrefs } from "../utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    const user = auth.currentUser;

    const authButton = document.getElementById("auth-button");
    const uiSwitchBtn = document.getElementById("ui-switch");

    authButton.onclick = signinUI;
    uiSwitchBtn.onclick = switchAuthUI;

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") authButton.click();
    });
    initAuthState(() => {
        startLoading();
        setTimeout(() => {
            window.location.href = "feed"
        }, 500);
    }, () => {
        endLoading();
        setTimeout(() => delayHrefs(), 500);
    });
});


let isSignIn = true;

function switchAuthUI() {
    const switcherBtn = document.querySelector("#ui-switch");
    const bigButton = document.querySelector("#auth-button");
    const bigHeading = document.querySelector("#auth-big-heading");
    const passwordForgot = document.querySelector("#forgot-password");
    const confirmPassField = document.querySelector("#confirm-pass-group");

    if (isSignIn) {
        switcherBtn.innerText = "Already have an Account? Sign-in.";
        bigButton.innerText = "Register";
        bigButton.classList.add("register-button");
        bigButton.onclick = registerUI;
        bigHeading.innerText = "Register";
        passwordForgot.style.display = "none";
        confirmPassField.style.display = "block";
        isSignIn = false;
    } else {
        switcherBtn.innerText = "Don't have an Account? Register.";
        bigButton.innerText = "Sign In";
        bigButton.classList.remove("register-button");
        bigButton.onclick = signinUI;
        bigHeading.innerText = "Sign-In";
        passwordForgot.style.display = "block";
        confirmPassField.style.display = "none";
        isSignIn = true;
    }
}

async function registerUI() {
    const email = document.querySelector("#auth-email").value;
    const pass = document.querySelector("#auth-password").value;
    const confirmPass = document.querySelector("#auth-confirmpass").value;

    if (!email) return alert("Email is required!");
    if (!isValidEmail(email)) return alert("Please enter a valid email address.");
    if (pass !== confirmPass) return alert("Passwords do not match.");

    const bigButton = document.querySelector("#auth-button");
    bigButton.disabled = true;

    try {
        const user = await createUserWithEmailAndPassword(auth, email, pass);
        alert("Registered successfully! Please don't spam!");

    } catch (err) {
        alert("Error: " + err.message);
        bigButton.disabled = false;
    }
}

async function signinUI() {
    const email = document.querySelector("#auth-email").value;
    const pass = document.querySelector("#auth-password").value;

    if (!email) return alert("Email is required!");
    if (!isValidEmail(email)) return alert("Please enter a valid email address.");
    if (!pass) return alert("Password is required!");
    if (pass.length < 6) return alert("Password must be at least 6 characters long.");

    const bigButton = document.querySelector("#auth-button");
    bigButton.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Signed in successfully!");
    } catch (err) {
        alert("Error: " + err.message);
        bigButton.disabled = false;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function logout() {
    auth.signOut();
}
