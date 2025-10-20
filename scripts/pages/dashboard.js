import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, geocode, buildStaticMapUrl, waitASecond } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { getPendingPosts,auth, updatePostStatus, doesUserExist } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        endLoading();
    }, () => {
        window.location.href = "signin";
    })
    await loadPostCards();
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
})

async function loadPostCards() {
    const postsContainer = document.querySelector(".core_feed");
    const posts = await getPendingPosts();

    for (const post of posts) {

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
        console.log(post);
        const postCards = summonTemplate("feed_post", {
            ".feed_post": { id: post.id },
            ".post_display_name": { text: post.display_name },
            ".post_desc": { text: post.description },
            ".tile_map": {
                bg: buildStaticMapUrl({
                    centerLon: post.location.longitude,
                    centerLat: post.location.latitude,
                    markers: [{}]
                })
            },
            ".post_tag": { text: POST_TAG_NAME[post.category] },
            ".image_container": { append: imgs },
            ".location_text": { text: address.display_name || "Unknown" },
            ".user_container": { append: [rejectBtn, approveBtn] },
            ".user_icon": {style: {"backgroundImage": `url(${post.user_avatar})`}}
        });

        approveBtn.addEventListener("click", async () => {
            approveBtn.disabled = true;
            try {
                await updatePostStatus(post.id, "APPROVED");
                document.querySelector(`#${post.id}`).remove();
                alert("Approved!");
            } catch (e) {
                console.error(e);
            }
        });

        rejectBtn.addEventListener("click", async () => {
            rejectBtn.disabled = true;
            try {
                await updatePostStatus(post.id, "REJECTED");
                document.querySelector(`#${post.id}`).remove();
                alert("Rejected!");
            } catch (e) {
                console.error(e);
            }
        });

        for (const postCard of postCards.children) {
            postsContainer.appendChild(postCard);
        }

        await waitASecond(250);
    }
}


export function logout() {
    auth.signOut();
}
