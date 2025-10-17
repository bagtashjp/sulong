import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, doesUserExist, saveUserData } from "../init-firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { endLoading, delayHrefs, uploadToCloudinary, getSignature } from "../utils.js";
let isButtonDisabled = false;
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();

    const authButton = document.getElementById("auth-button");
    const uiSwitchBtn = document.getElementById("ui-switch");

    authButton.onclick = signinUI;
    uiSwitchBtn.onclick = switchAuthUI;

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !isButtonDisabled) authButton.click();
    });
    initAuthState(() => {
        setTimeout(async () => {
            const eee = await doesUserExist(auth.currentUser.uid);
            console.log(eee);
            if (!eee) {
                authExtra();
                endLoading();
            } else {
                window.location.href = "feed"
            }
        }, 500);
    }, () => {
        endLoading();
        setTimeout(() => delayHrefs(), 500);
    });

});

let profilePic = null;
async function submitProfile() {

    const thbtn = document.querySelector("#get-button");
    thbtn.disabled = true;
    thbtn.textContent = "Submitting...";
    try {
        const firstName = document.querySelector("#auth-firstname").value;
        const lastName = document.querySelector("#auth-lastname").value;
        let img;
        if (!profilePic) {
            img = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";
        } else {
            const signature = await getSignature(crypto.randomUUID());
            img = await uploadToCloudinary(profilePic, signature);
        }
        if (!firstName || !lastName) {
            return alert("Please fill out all required fields.");
        }
        await saveUserData({
            first_name: firstName,
            last_name: lastName,
            avatar: img
        });
        alert("Profile completed successfully!");
        window.location.href = "feed";
    } catch (e) {
        alert("Error submitting profile: " + e.message);
        thbtn.disabled = false;
        thbtn.textContent = "Submit Profile";
    }
}

let isSignIn = true;
function authExtra() {
    document.querySelector("#signin-form-main").style.display = "none";
    document.querySelector("#signup-extra").style.display = "flex";
    document.querySelector("#auth-button").disabled = true;
    isButtonDisabled = true;
    document.querySelector("#get-button").addEventListener("click", submitProfile);
    document.querySelector("#attach-photo").addEventListener("click", () => document.querySelector("#profile-upload").click());
    document.querySelector("#profile-upload").addEventListener("change", (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file!");
            evt.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePic = e.target.result;
            document.querySelector("#signup-profile-preview").src = profilePic;
            console.log("Image loaded:", profilePic);
        };
        reader.readAsDataURL(file);
    });
}


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
        await createUserWithEmailAndPassword(auth, email, pass);
        authExtra();


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

async function submitPosts() {

}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function logout() {
    auth.signOut();
}
