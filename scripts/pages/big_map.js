import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, generatePublicId, geocode, buildStaticMapUrl, waitASecond, summonToast, startLoading } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, getApprovedPosts, doesUserExist, setReaction, removeReaction, getUserPostReaction, getReactionCount } from "../init-firebase.js";
import { POST_TAG_NAME, POST_TAG_COLOR } from "../z_constants.js";


export async function refreshPosts() {
    const postsContainer = document.querySelector(".core_feed");
    clearPostsContainer(postsContainer);
    await loadPostCards();
}

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        await loadPostCards();
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
})
let reactTimestamp = 0;

async function loadPostCards() {
    let posts = await getApprovedPosts(100);
    const map = new maplibregl.Map({
        container: 'big_map_wrapper',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [120.5394262, 14.6779294],
        zoom: 13
    });

    map.on('load', () => {
        posts.forEach(post => {
            const category = post.category || 'tags_other';
            console.log("Post category:", category);
            const color = POST_TAG_COLOR[category] || POST_TAG_COLOR.tags_other;
            const marker = new maplibregl.Marker({
                color: color,
                scale: 1.5
            })
                .setLngLat([post.location.longitude, post.location.latitude])
                .setPopup(new maplibregl.Popup({ offset: 20 })
                    .setHTML(`
            <strong>${post.display_name}</strong>
            <p>${post.description}</p>
          `))

                .addTo(map);
                post.marker = marker;
        });
        document.querySelector("#filter_by_category").addEventListener("change", (e) => {
            const selectedCategory = e.target.value;    
            posts.forEach(post => {
                if (post.marker) {
                    post.marker.getElement().style.display = post.category === selectedCategory || selectedCategory === "tags_null" ? "block" : "none";
                }
            });
        });
    })
     const styles = {
        "3D": 'https://tiles.openfreemap.org/styles/liberty',
        "Bright": 'https://tiles.openfreemap.org/styles/bright',
        "CartoDB": 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        "Dark Mode": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    };

    const styleSelector = document.createElement('select');
    styleSelector.id = "map_style_selector";
    for (const [name, url] of Object.entries(styles)) {
        const option = document.createElement('option');
        option.value = url;
        option.textContent = name;
        styleSelector.appendChild(option);
    }
    document.querySelector("#big_map_wrapper").appendChild(styleSelector);
    styleSelector.addEventListener('change', (e) => {
        map.setStyle(e.target.value);
    });
    endLoading();
}



export function logout() {
    auth.signOut();
}

window.summonToast = summonToast;