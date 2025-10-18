const cardCache = {};
export const cardNodes = {};


export async function renderCards() {
    const cardElements = Array.from(document.querySelectorAll("card"));
    for (const el of cardElements) {
        await renderCard(el.id, el, el.dataset);
    }
}
export async function renderCardsAsync(names) {
    for (let data of names) {
        const node = document.createElement("blank-card");
        const theText = await loadTemplate(`cards/${data}.html`);
        node.innerHTML = theText;
        cardNodes[data] = node;
    }
}

export async function renderCard(templateId, targetEl = null, data = {}) {

    if (!cardCache[templateId]) {
        cardCache[templateId] = await loadTemplate(`cards/${templateId}.html`);
    }

    let templateHTML = cardCache[templateId];
    if (!templateHTML) return null;

    templateHTML = replacePlaceholders(templateHTML, data);

    if (targetEl) {
        targetEl.outerHTML = templateHTML;
    } else {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = templateHTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    return templateHTML;
}

function replacePlaceholders(template, data) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return key in data ? data[key] : "";
    });
}

export function summonTemplate(node_name, data) {
    const node = cardNodes[node_name].cloneNode(true);
    for (const [key, value] of Object.entries(data)) {
        const child = node.querySelector(key);
        
        if (!!value.append) child.append(...(Array.isArray(value.append) ? value.append : [value.append]));
        if (!!value.html) child.innerHTML = value.html;
        if (!!value.text) child.textContent = value.text;
        if (!!value.attr) child.setAttribute(value.attr[0], value.attr[1]);
        if (!!value.style) Object.assign(child.style, value.style);
        if (!!value.onclick) child.onclick = value.onclick;
        if (!!value.id) child.id = value.id;
        if (!!value.bg) setBackgroundPreload(child, value.bg);
    }
    return node;
}

export function setBackgroundPreload(el, imageUrl) {
    const img = new Image();
    img.onload = () => {
        el.style.backgroundImage = `url(${imageUrl})`;
        el.style.backgroundColor = "transparent";
        el.classList.add("bg-loaded");
    };
    img.src = imageUrl;
}
async function loadTemplate(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return await res.text();
    } catch (err) {
        console.error("Error loading template:", path, err);
        return null;
    }
}
