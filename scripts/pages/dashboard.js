import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, generatePublicId, geocode } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { getPendingPosts, updatePostStatus } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post"]);
    initDarkmode();
    initAuthState(async () => {
        await loadPostCards();
        endLoading();
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
})
async function loadPostCards() {
    const postsContainer = document.querySelector(".core_feed");
    const posts = await getPendingPosts();
    for (const post of posts) {
        const mapid = generatePublicId()
        const imgs = [];
        for (const imgUrl of post.media || []) {
            const img = document.createElement("span");
            img.classList.add("feed-image-preview");
            img.style.backgroundImage = `url(${imgUrl})`;
            imgs.push(img);
        }
        const address = await geocode(post.location.latitude, post.location.longitude);
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "Approve";
        approveBtn.classList.add("admin_approve_button");

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.classList.add("admin_reject_button");


        const postCards = summonTemplate("feed_post", {
            ".feed_post": { id: post.id },
            ".post_display_name": { text: post.display_name },
            ".post_desc": { text: post.description },
            ".tile_map": { id: mapid },
            ".post_tag": { text: POST_TAG_NAME[post.category] },
            ".image_container": { append: imgs },
            ".location_text": { text: address.display_name || "Unknown" },
            ".user_container": { append: [rejectBtn, approveBtn] }
        });

        approveBtn.addEventListener("click", async () => {
            approveBtn.disabled = true;
            try {
                await updatePostStatus(post.id, "APPROVED");
                document.querySelector(`#${post.id}`).remove();
                alert("Approved!");
            } catch (e) { console.error(e); }
        });
        rejectBtn.addEventListener("click", async () => {
            rejectBtn.disabled = true;
            try {
                await updatePostStatus(post.id, "REJECTED");
                
                document.querySelector(`#${post.id}`).remove();
                alert("Rejected!");
            } catch (e) { console.error(e); }
        });
        for (const postCard of postCards.children) {
            postsContainer.appendChild(postCard);
        }
        const map = new maplibregl.Map({
            container: mapid,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [post.location.longitude, post.location.latitude],
            zoom: 10,
            interactive: false,
            attributionControl: false
        });
        new maplibregl.Marker({ draggable: false })
            .setLngLat([post.location.longitude, post.location.latitude])
            .addTo(map);

    }
}
export function logout() {
    auth.signOut();
}
