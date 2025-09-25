
async function init() {
  page = {
    home: document.getElementById("home").innerHTML,
    about: await loadTemplate("./pages/about.html")
  };
  window.addEventListener("hashchange", showPage);
  showPage();
}


function showPage() {
  const hash = location.hash || "#home";
  document.getElementsByTagName("page")[0].innerHTML = page[hash.replace("#", "")] || "<h1>404 Not Found</h1>";
}

// Modularizer

let page = {};

async function loadTemplate(path) {
  const res = await fetch(path);
  const html = await res.text();
  return html;
}



init();