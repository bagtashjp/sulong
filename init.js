
// THIS WILL BE OBSOLETE FOR NOW, BUT KEPT FOR REFERENCE

// Config
//const pages = ["about"];
const cards = ["header"];


// Initialization
//const page = {};
const card = {};
async function init() {
    //page["#home"] = document.getElementById("home").outerHTML;

    for (const c of cards) {
        card[c] = await loadTemplate(`./cards/${c}.html`);
    }
    for (const element of document.getElementsByTagName("card")) {
        element.outerHTML = card[element.id];
    }
    //window.addEventListener("hashchange", showPage);
    //showPage();
}

// Routing

/*
async function showPage() {
    const hash = location.hash || "#home";
    /*if (!page[hash]) {
        page[hash] = await loadTemplate(`./pages/${hash.replace("#", "")}.html`);
    } 
    document.querySelector("page").outerHTML = page[hash] || page["404"];
    const newpage = document.querySelector("page");
    
    // Parses dataset attributes like title
    /*if (newpage.hasAttribute("data-title")) {
        document.title = newpage.dataset.title;
        newpage.removeAttribute("data-title");
    }
    // Will be expected to add more dataset parsing in the future

    for (const element of document.getElementsByTagName("card")) {
        element.outerHTML = card[element.id];
    }
}
*/
async function loadTemplate(path) {
    const res = await fetch(path + "?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) {
        return null;
    }
    return await res.text();
}

init();


