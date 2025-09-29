let isUISignin = true;
function switchAuthUI() {
    const switcherBtn = document.getElementById("ui-switch");
    const bigButton = document.getElementById("auth-button");
    const bigHeading = document.getElementById("auth-big-heading");
    const passwordForgot = document.getElementById("forgot-password");
    
    if (isUISignin) {
        switcherBtn.innerText = "Already have an Account? Sign-in.";
        bigButton.innerText = "Register";
        bigButton.classList.add("register-button")
        bigButton.removeAttribute("onclick");
        bigButton.setAttribute("onclick", "registerUI()");
        bigHeading.innerText = "Register";
        passwordForgot.style.display = "none";
        isUISignin = false;
    } else {
        switcherBtn.innerText = "Don't have an Account? Register.";
        bigButton.innerText = "Sign In";
        bigButton.classList.remove("register-button");
        bigButton.removeAttribute("onclick");
        bigButton.setAttribute("onclick", "signinUI()");
        bigHeading.innerText = "Sign-In";
        passwordForgot.style.display = "block";
        isUISignin = true;
    }
}
window.switchAuthUI = switchAuthUI;