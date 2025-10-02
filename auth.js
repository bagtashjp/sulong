import { auth } from "./scripts/init-firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

let isUISignin = true;
function switchAuthUI() {
      const switcherBtn = document.querySelector("#ui-switch");
    const bigButton = document.querySelector("#auth-button");
    const bigHeading = document.querySelector("#auth-big-heading");
    const passwordForgot = document.querySelector("#forgot-password");
    const confirmPassField = document.querySelector("#confirm-pass-group");
    if (isUISignin) {
        switcherBtn.innerText = "Already have an Account? Sign-in.";
        bigButton.innerText = "Register";
        bigButton.classList.add("register-button")
        bigButton.removeAttribute("onclick");
        bigButton.setAttribute("onclick", "registerUI()");
        bigHeading.innerText = "Register";
        passwordForgot.style.display = "none";
        confirmPassField.style.display = "block";
        isUISignin = false;
    } else {
        switcherBtn.innerText = "Don't have an Account? Register.";
        bigButton.innerText = "Sign In";
        bigButton.classList.remove("register-button");
        bigButton.removeAttribute("onclick");
        bigButton.setAttribute("onclick", "signinUI()");
        bigHeading.innerText = "Sign-In";
        passwordForgot.style.display = "block";
        confirmPassField.style.display = "none";
        isUISignin = true;
    }
}
function registerUI() {
    const email = document.querySelector("#auth-email").value;
    const pass = document.querySelector("#auth-password").value;
    const confirmPass = document.querySelector("#auth-confirmpass").value;
    if (!email) {
        alert("Email is required!"); 
    } else if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
    } else if (pass != confirmPass) {
        alert("Passwords do not match.");
    } else {
        const bigButton = document.querySelector("#auth-button");
        bigButton.disabled = true;  
        createUserWithEmailAndPassword(auth, email, pass)
        .then((user) => {
            alert("Registered successfully!Please don't spam! This is just a test");
            bigButton.enabled = false;
            switchAuthUI();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Error: " + errorMessage);
            bigButton.disabled = false;
        });
    }
}
let justOnce = false;
async function signinUI() {
    const email = document.querySelector("#auth-email").value;
    const pass = document.querySelector("#auth-password").value;
    if (!email) {
        alert("Email is required!"); 
    } else if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
    } else if (!pass) {
        alert("Password is required!");
    } else if (pass.length < 6) {
        alert("Password must be at least 6 characters long.")
    } else {
        const bigButton = document.querySelector("#auth-button");
        bigButton.disabled = true;
        justOnce = true;
        await signInWithEmailAndPassword(auth, email, pass)
        .then((user) => {
            alert("Signed in successfully!\nPlease don't spam! This is just a test");
            window.location.href = "feed";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Error: " + errorMessage);
            bigButton.disabled = false;
        });
    }

}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


onAuthStateChanged(auth, (user) => {
    if (justOnce) return;
    if (user) {
        let isConfirm = confirm("User is already signed in. You'll be redirected to home page.\nIf you wanna test again. Pressing cancel will sign out the user.");
        if (isConfirm) {
            window.location.href="index";
        } else {
            auth.signOut();
        }
    } else {
        console.log("No user is signed in.");
    }
});

window.registerUI = registerUI;
window.signinUI = signinUI;
window.switchAuthUI = switchAuthUI;

