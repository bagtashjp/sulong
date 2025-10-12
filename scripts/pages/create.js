import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars , endLoading, delayHrefs} from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    initAuthState(()=>{}, () => {
        window.location.href = "index";
    })
    initNavBars();
    endLoading();
    setTimeout(() => delayHrefs(), 100);
})

export function logout() {
    auth.signOut();
}
