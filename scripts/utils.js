import { auth } from "./init-firebase.js";

export function initNavBars() {
    document.querySelector("#logout_btn").addEventListener("click", logout);
}

function logout() {
    auth.signOut();
}

export function endLoading() {
    document.querySelector("#loading_page").style.top = "100%";
}

export function startLoading() {
    document.querySelector("#loading_page").style.top = "0";
}

export function delayHrefs() {
    Array.from(document.getElementsByTagName("a")).forEach(a => {
        a.addEventListener("click", (evt)=>{
            evt.preventDefault();
            startLoading();
            setTimeout(() => {
                window.location.href = a.href
            },500)
        })
        
    })
}