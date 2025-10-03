import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    initAuthState(()=>{}, () => {
        window.location.href = "index";
    })
    initNavBars();
    
    document.querySelector("#loading_page").style.display = "none";
})

export function logout() {
    auth.signOut();
}
