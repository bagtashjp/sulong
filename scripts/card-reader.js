const cardCache = {};

export async function renderCards() {
    const cardElements = Array.from(document.querySelectorAll("card"));
    for (const el of cardElements) {
        await renderCard(el.id, el, el.dataset);
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

async function loadTemplate(path) {
    try {
        const res = await fetch(path + "?v=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return null;
        return await res.text();
    } catch (err) {
        console.error("Error loading template:", path, err);
        return null;
    }
}
