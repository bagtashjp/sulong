async function init() {
  page = {
    home: document.getElementById("home").outerHTML,
    about: await loadTemplate("./pages/about.html")
  };
  card = {
    header: await loadTemplate("./cards/header.html")
  }
  window.addEventListener("hashchange", showPage);
  showPage();
}


// Adjusts the content of <page> based on the URL hash
function showPage() {
  const hash = location.hash || "#home";
    document.getElementsByTagName("page")[0].outerHTML = page[hash.replace("#", "")] || "<h1>404 Not Found</h1>";
  initCards();
}

let page = {};
let card = {};
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