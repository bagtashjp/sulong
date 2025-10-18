import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { endLoading, delayHrefs } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    initAuthState(() => { });
    endLoading();
    setTimeout(() => delayHrefs(), 500);

})