// Config

// Initialization
let card = {};
async function init() {
    for (const e of Array.from(document.querySelectorAll("card"))) {
        if (!card[e.id]) {
            card[e.id] = await loadTemplate(`cards/${e.id}.html`);
        }
        if (!card[e.id]) continue;
        e.outerHTML = card[e.id];
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
