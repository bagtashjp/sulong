import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, geocode, buildStaticMapUrl, waitASecond } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { getPendingPosts,auth, updatePostStatus, doesUserExist } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        endLoading();
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setupAdminBar();
    
    setTimeout(() => delayHrefs(), 500);
})

function setupAdminBar() {
    document.querySelector(".anagraphs").href = "#analytics_graphs";
    document.querySelector(".anatables").href = "#analytics_tables";
    const params = new URLSearchParams(window.location.search);
    if (params.get("goto") === "graphs") {
        document.querySelector("#analytics_graphs").scrollIntoView();
    } else if (params.get("goto") === "tables") {
        document.querySelector("#analytics_tables").scrollIntoView();
    }
}

export function logout() {
    auth.signOut();
}
