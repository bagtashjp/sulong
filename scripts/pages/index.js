import { renderCards } from "../card-reader.js";
import { initDarkmode } from "../theme.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    initDarkmode();
})