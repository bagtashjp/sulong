// Declare pages and cards here to load
const pages = ["about"];
const cards = ["header"];
async function init() {
    page["#home"] = document.getElementById("home").outerHTML;
    page["404"] = await loadTemplate("./pages/404.html");
    for (const c of cards) {
        card[c] = await loadTemplate(`./cards/${c}.html`);
    }
    window.addEventListener("hashchange", showPage);
    showPage();
}


// Adjusts the content of <page> based on the URL hash
async function showPage() {
    const hash = location.hash || "#home";
    if (!page[hash]) page[hash] = await loadTemplate(`./pages/${hash.replace("#", "")}.html`);
    document.querySelector("page").outerHTML = page[hash] || page["404"];
    initCards();
}

const page = {};
const card = {};

async function loadTemplate(path) {
    const res = await fetch(path + "?v=" + Date.now(), { cache: "no-store" });
    return await res.text();
}
function initCards() {
    for (const element of document.getElementsByTagName("card")) {
        element.outerHTML = card[element.id];
    }
}
init();