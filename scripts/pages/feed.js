import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, generatePublicId,buildStaticMapUrl, waitASecond, summonToast, startLoading } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, getApprovedPosts, doesUserExist, setReaction, removeReaction, getReactions, getReactionCount } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

/**
 * Clear all posts from the feed container safely.
 * - removes common inline event handlers to reduce accidental retention
 * - removes child nodes
 *
 * Use `refreshPosts()` to clear then reload posts (handy for filters).
 */

export function clearPostsContainer(container = document.querySelector(".core_feed")) {
    if (!container) return;
    // Remove common inline handlers to avoid accidental references
    container.querySelectorAll("*").forEach(el => {
        try {
            el.onclick = null;
            el.onchange = null;
            el.onmouseover = null;
            el.onmouseout = null;
            el.onkeyup = null;
            el.onkeydown = null;
        } catch (e) {
            // ignore
        }
    });
    // Remove child nodes
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

/**
 * Convenience: clear the feed then reload posts.
 */
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
    const postsContainer = document.querySelector(".core_feed");
    const posts = await getApprovedPosts();
    endLoading();
    for (const post of posts) {

        const imgs = [];
        for (const imgUrl of post.media || []) {
            const img = document.createElement("span");
            img.classList.add("feed-image-preview");
            img.style.backgroundImage = `url(${imgUrl})`;
            img.onclick = () => {
                window.open(imgUrl, "_blank");
            }
            imgs.push(img);
        }

        const address = await (await fetch(`/api/georeverse?lat=${post.location.latitude}&lon=${post.location.longitude}`)).json();
        const voteCount = await getReactionCount(post.id, "UPVOTE") - await getReactionCount(post.id, "DOWNVOTE");
        let userReaction = (await getReactions(post.id))?.type;
        const downvoteId = "_" + crypto.randomUUID();
        const upvoteId = "_" + crypto.randomUUID();
        const reactionCountId = "_" + crypto.randomUUID();


        const postCards = summonTemplate("feed_post", {
            ".feed_post": { id: post.id },
            ".post_display_name": { text: post.display_name },
            ".post_desc": { text: post.description },
            ".tile_map": {
                style: {
                    backgroundImage: `url(${buildStaticMapUrl({
                        centerLon: post.location.longitude,
                        centerLat: post.location.latitude,
                        markers: [{}]
                    })})`
                }
            },
            ".post_tag": { text: POST_TAG_NAME[post.category] },
            ".image_container": { append: imgs },
            ".location_text": { text: address.display_name || "Unknown" },
            ".user_icon": { bg: post.user_avatar },
            ".post-reaction-count": { text: (voteCount > 99 ? `99+` : "" + voteCount), id: reactionCountId },
            ".upvote_button": {
                img: userReaction == "UPVOTE" ? "assets/upvote_shaded_icon.svg" : "assets/upvote_icon.svg",
                id: upvoteId
            },
            ".downvote_button": {
                img: userReaction == "DOWNVOTE" ? "assets/downvote_shaded_icon.svg" : "assets/downvote_icon.svg",
                id: downvoteId
            },
            ".comment_button": {
                onclick: () => {
                    startLoading();
                    setTimeout(() => {
                        window.location.href = `post?id=${post.id}`;
                    }, 800);
                }
            }
        });
        postCards.querySelector(".upvote_button").onclick = async (evt) => {
            if (reactTimestamp + 3000 > Date.now()) {
                summonToast("Woah woah not too fast!!");
                return;
            }
            if (userReaction == "UPVOTE") {
                try {
                    await removeReaction(post.id);
                    document.querySelector("#" + upvoteId).src = "assets/upvote_icon.svg";
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount -= 1;
                    reactionCountEl.textContent = (currentCount > 99 ? `99+` : "" + currentCount);
                    userReaction = null;
                    summonToast("Reaction removed.");
                } catch (error) {
                    summonToast("Error removing reaction. Check console.");
                    console.error("Error removing reaction:", error);
                }
            } else {
                if (userReaction == "DOWNVOTE") {
                    document.querySelector("#" + downvoteId).src = "assets/downvote_icon.svg";
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount += 1;
                    reactionCountEl.textContent = (currentCount > 99 ? `99+` : "" + currentCount);
                }
                try {
                    await setReaction(post.id, "UPVOTE");
                    document.querySelector("#" + upvoteId).src = "assets/upvote_shaded_icon.svg";
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount += 1;
                    reactionCountEl.textContent = (currentCount > 99 ? `99+` : "" + currentCount);
                    userReaction = "UPVOTE";
                    summonToast("Reaction updated.");
                } catch (error) {
                    summonToast("Error adding reaction. Check console.");
                    console.error("Error adding reaction:", error);
                }
            }
            reactTimestamp = Date.now();
        }
        postCards.querySelector(".downvote_button").onclick = async (evt) => {
            if (reactTimestamp + 3000 > Date.now()) {
                summonToast("Woah woah not too fast.");
                return;
            }
            if (userReaction === "DOWNVOTE") {
                try {
                    await removeReaction(post.id);
                    evt.target.src = "assets/downvote_icon.svg"; // reset icon
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount += 1; // undo the downvote
                    reactionCountEl.textContent = currentCount > 99 ? "99+" : "" + currentCount;
                    userReaction = null;
                    summonToast("Reaction removed.");
                } catch (error) {
                    summonToast("Error removing reaction. Check console.");
                    console.error("Error removing reaction:", error);
                }
            } else {
                // User is changing reaction from upvote or no reaction
                if (userReaction === "UPVOTE") {
                    document.querySelector("#" + upvoteId).src = "assets/upvote_icon.svg";
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount -= 1; // undo the upvote
                    reactionCountEl.textContent = currentCount > 99 ? "99+" : "" + currentCount;
                }

                try {
                    await setReaction(post.id, "DOWNVOTE");
                    document.querySelector("#" + downvoteId).src = "assets/downvote_shaded_icon.svg"; // mark as active
                    const reactionCountEl = document.querySelector("#" + reactionCountId);
                    let currentCount = parseInt(reactionCountEl.textContent);
                    if (isNaN(currentCount)) currentCount = 99;
                    currentCount -= 1;
                    reactionCountEl.textContent = currentCount > 99 ? "99+" : "" + currentCount;
                    userReaction = "DOWNVOTE";
                    summonToast("Reaction updated.");
                } catch (error) {
                    summonToast("Error adding reaction. Check console.");
                    console.error("Error adding reaction:", error);
                }
            }
            reactTimestamp = Date.now();

        };


        for (const postCard of postCards.children) {
            postsContainer.appendChild(postCard);
        }

        await waitASecond(250);
    }
}

export function logout() {
    auth.signOut();
}

window.summonToast = summonToast;