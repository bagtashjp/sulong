// Config
const cards = ["header"];

// Initialization
const card = {};
async function init() {
    for (const c of cards) {
        card[c] = await loadTemplate(`./cards/${c}.html`);
    }
    for (const element of document.getElementsByTagName("card")) {
        element.outerHTML = card[element.id];
    }
}

async function loadTemplate(path) {
    const res = await fetch(path + "?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) {
        return null;
    }
    return await res.text();
}

init();


