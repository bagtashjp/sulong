import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { endLoading, delayHrefs } from "../utils.js";
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
    endLoading();
    setTimeout(() => delayHrefs(), 500);
})