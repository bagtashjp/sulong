// Config
const cards = ["header", "left_nav"];

// Initialization
const card = {};
async function init() {
    for (const c of cards) {
        card[c] = await loadTemplate(`cards/${c}.html`);
        console.log(card[c]);
    }
    for (const element of Array.from(document.querySelectorAll("card"))) {
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
