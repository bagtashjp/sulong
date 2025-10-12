import { auth } from "./init-firebase.js";

export function initNavBars() {
    document.querySelector("#logout_btn").addEventListener("click", logout);
}

function logout() {
    auth.signOut();
}

export function endLoading() {
    document.body.classList.remove("loading_control");
    document.querySelector("#loading_page").style.top = "100%"
    /*
    document.querySelector("#loading_page").classList.remove("loading_starter");
    document.querySelector("#loading_page").classList.add("loading_ender");*/
}

export function startLoading() {
    document.querySelector("#loading_page").style.top = "0%"
    document.body.classList.add("loading_control");
    /*
    document.querySelector("#loading_page").classList.add("loading_starter");
    document.querySelector("#loading_page").classList.remove("loading_ender");*/
}

export function delayHrefs() {
    Array.from(document.getElementsByTagName("a")).forEach(a => {
        a.addEventListener("click", (evt)=>{
            evt.preventDefault();
            startLoading();
            setTimeout(() => {
                window.location.href = a.href
            },800)
        })
    })
}

