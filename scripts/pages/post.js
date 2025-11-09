import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, generatePublicId, waitASecond, summonToast, initNotifications } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import {
    auth,
    getPost,
    doesUserExist,
    getReactionCount,
    getComments,
    addComment,
    getCurrentUserData,
    getReactions,
    removeReaction,
    setReaction,
    setProgress,
    getProgress,
    markPostResolved,
    addBookmark,
    removeBookmark
} from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

let userData = null;
let bookmarkTimestamp = 0;
document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post", "comment", "progress"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        userData = await getCurrentUserData();
        initNotifications()
        endLoading();
        const params = new URLSearchParams(window.location.search);
        if (!params.has("id")) {
            summonToast("Invalid link.", 10000);
            return;
        }
        const postId = params.get("id");
        await loadPostCard(postId);
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
})

async function loadPostCard(postId) {
    const postsContainer = document.querySelector(".core_feed");
    const post = await getPost(postId);
    const userData = JSON.parse(localStorage.getItem("userData"));
    let bookmarks = userData.bookmarks.map(e => e.id);
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
        ".post_tag": { text: POST_TAG_NAME[post.category] },
        ".image_container": { append: imgs },
        ".location_text": { text: address.display_name || "Unknown" },
        ".user_icon": { bg: post.user_avatar },
        ".post-reaction-count": { text: (voteCount > 99 ? `99+` : "" + voteCount), id: reactionCountId },
        ".comments_section": { style: { display: "flex" } },
        ".progress_section": { style: { display: "flex" } },
        ".post_status": {
            text: post.status === "RESOLVED" ? "Resolved" : "Open",
            style: {
                display: "inline-block",
                backgroundColor: post.status === "RESOLVED"
                    ? "rgba(70, 253, 70, 0.55)"
                    : "rgba(255, 255, 255, 0.3)"
            }
        },
        ".comment_button": { style: { display: "none" } },
        ".upvote_button": {
            img: userReaction == "UPVOTE" ? "assets/upvote_shaded_icon.svg" : "assets/upvote_icon.svg",
            id: upvoteId
        },
        ".downvote_button": {
            img: userReaction == "DOWNVOTE" ? "assets/downvote_shaded_icon.svg" : "assets/downvote_icon.svg",
            id: downvoteId
        },
        ".new_comment_submit": {
            onclick: async (evt) => {
                const commentInput = document.querySelector(".new_comment_input")?.value.trim();
                if (commentInput.length == 0) {
                    summonToast("Please enter a comment.", 3000);
                    return;
                }
                evt.target.disabled = true;
                try {
                    await addComment(post.id, commentInput);
                    summonToast("Comment added!", 3000);
                    const commentNode = summonTemplate("comment", {
                        ".comment_display_name": { text: userData.first_name + " " + userData.last_name },
                        ".comment_text": { text: commentInput },
                        ".comment_user_icon": { bg: userData.avatar }
                    });

                    for (const commentCard of commentNode.children) {
                        commentsContainer.appendChild(commentCard);
                    }
                    document.querySelector(".new_comment_input").value = "";
                } catch (error) {
                    console.error("Error adding comment:", error);
                    summonToast("Error adding comment. " + error, 5000);
                } finally {
                    setTimeout(() => evt.target.disabled = false, 5000);
                }
            }
        },
        ".favorite_button": {
            img: (bookmarks.includes(post.id))
                ? "assets/bookmark_icon-shaded.svg"
                : "assets/bookmark_icon.svg",
            onclick: async (evt) => {
                if (bookmarkTimestamp + 3000 > Date.now()) {
                    summonToast("Woah woah not too fast!!");
                    return;
                }
                if (bookmarks.includes(post.id)) {
                    await removeBookmark(post.id);
                    evt.target.src = "assets/bookmark_icon.svg";
                    bookmarks = bookmarks.filter(b => b !== post.id);
                    summonToast("Removed bookmark.");
                } else {
                    await addBookmark(post.id);
                    evt.target.src = "assets/bookmark_icon-shaded.svg";
                    bookmarks.push(post.id);
                    summonToast("Added bookmark.");
                }
                bookmarkTimestamp = Date.now();
            }
        }
    });

    auth.currentUser.getIdTokenResult(false).then((idTokenResult) => {
        const role = idTokenResult.claims.role;
        if (post.status != "RESOLVED" && (role == "ADMIN" || role == "LGU")) {
            document.querySelector(".new_progress_wrapper").style.display = "flex";
            document.querySelector(".mark-resolved-button").style.display = "inline-block";
            document.querySelector(".new_progress_submit").onclick = async (evt) => {
                const progressInput = document.querySelector(".new_progress_input")?.value.trim();
                if (progressInput.length == 0) {
                    alert("Please enter a progress update.");
                    return;
                }
                evt.target.disabled = true;
                try {
                    const timestamp = await setProgress(post.id, progressInput);

                    summonToast("Progress added!", 3000);
                    const progressNode = summonTemplate("progress", {
                        ".progress_user": { text: userData.first_name + " " + userData.last_name },
                        ".progress_text": { text: progressInput },
                        ".progress_timestamp": { text: toDateString(timestamp) }
                    });

                    for (const progressCard of progressNode.children) {
                        progressContainer.prepend(progressCard);
                    }
                    document.querySelector(".new_progress_input").value = "";
                } catch (error) {
                    console.error("Error adding progress:", error);
                    summonToast("Error adding progress. " + error, 5000);
                } finally {
                    setTimeout(() => evt.target.disabled = false, 5000);
                }
            }
            document.querySelector(".mark-resolved-button").onclick = async (evt) => {

                const conf = confirm("Are you sure you want to mark this post as resolved? This action cannot be undone.");
                if (!conf) return;
                evt.target.disabled = true;
                try {
                    await markPostResolved(post.id);
                    summonToast("Post marked as resolved.", 5000);
                    document.querySelector(".mark-resolved-button").style.display = "none";
                    document.querySelector(".new_progress_wrapper").style.display = "none";
                } catch (err) {
                    console.error("Error marking post as resolved:", err);
                    alert("Error marking post as resolved. " + err);
                } finally {
                    setTimeout(() => evt.target.disabled = false, 5000);
                }
            }
        }
    });
    postCards.querySelector(".upvote_button").onclick = async (evt) => {
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
            return;
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
    }
    postCards.querySelector(".downvote_button").onclick = async (evt) => {
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

    }
    for (const postCard of postCards.children) {
        postsContainer.appendChild(postCard);
    }
    const commentsContainer = document.querySelector(".comments_wrapper");
    const comments = await getComments(post.id, 100);
    const progressContainer = document.querySelector(".progress_wrapper");
    const progresses = await getProgress(post.id, 100);
    for (const comment of comments) {
        const commentNode = summonTemplate("comment", {
            ".comment_display_name": { text: comment.display_name },
            ".comment_text": { text: comment.body },
            ".comment_user_icon": { bg: comment.user_avatar }
        });
        for (const commentCard of commentNode.children) {
            commentsContainer.appendChild(commentCard);
        }
    }
    console.log(progresses.length)
    for (const progress of progresses) {
        const progressNode = summonTemplate("progress", {
            ".progress_user": { text: progress.display_name },
            ".progress_text": { text: progress.body },
            ".progress_timestamp": { text: toDateString(progress.timestamp) }
        });
        for (const progressCard of progressNode.children) {
            progressContainer.appendChild(progressCard);
        }
    }
    const map = new maplibregl.Map({
        container: 'map_holder',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [post.location.longitude, post.location.latitude],
        zoom: 16,
        minZoom: 10,
        maxZoom: 19,
        attributionControl: false
    });
    map.setPitch(60);
    map.addControl(new maplibregl.NavigationControl());
    map.addControl(new maplibregl.AttributionControl(), 'top-right')
    const marker = new maplibregl.Marker({
        draggable: false,
        color: "#FF0000",
        scale: 1.5
    })
        .setLngLat([post.location.longitude, post.location.latitude])
        .addTo(map);
}

function toDateString(timestamp) {
    const date = timestamp.toDate();

    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    return `${hours}:${minutes}${ampm} ${month} ${day}, ${year}`;

}

export function logout() {
    auth.signOut();
}

window.summonToast = summonToast;