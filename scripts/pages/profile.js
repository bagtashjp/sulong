import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, generatePublicId, waitASecond, summonToast, startLoading, initNotifications, convertSimilarity, getSignature, uploadToCloudinary } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { auth, doesUserExist, setReaction, removeReaction, getReactions, getReactionCount, removeBookmark, addBookmark, addEmbedding, searchPosts, getUserPosts, getCurrentUserData, getBookmarkedPosts, updateUserData, changePassword } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";


document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["feed_post", "user_profile", "profile_setting"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        endLoading();
        initNotifications();
        
        const params = new URLSearchParams(window.location.search);
        /*if (params.has("id")) {
            document.querySelector(".feed_sorter_container").style.display = "flex";
            document.getElementById("search_query").textContent = params.get("id");
        } else {
        }*/
        await loadProfile();
        await loadProfileSetting();
        await loadPostCards(await getUserPosts(1));
        const filterBookmarks = bookmarks.filter(b => !savedBookmarks[b]);
        loadBookmarks(await getBookmarkedPosts(filterBookmarks));    
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
})

let reactTimestamp = 0;
let bookmarkTimestamp = 0;
let bookmarks;

async function loadProfile(userId = null) {
    const userData = await getCurrentUserData();
    const profile = summonTemplate("user_profile", {
        ".profile_name": { text: userData.first_name + " " + userData.last_name },
        ".profile_bio": { text: auth.currentUser.email },
        ".profile_avatar": { img: userData.avatar }
    });
    document.querySelector(".feed_layer").prepend(profile.children[0]);
}
const savedBookmarks = {};

async function loadPostCards(posts) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    bookmarks = userData.bookmarks.map(e => e.id);
    const postsContainer = document.querySelector("#profile_posts_container");
    document.querySelector("#post_loading_indicator").remove();
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
        const address = post.address_name
            ? {display_name: post.address_name}
            : await (await fetch(`/api/georeverse?lat=${post.location.latitude}&lon=${post.location.longitude}`)).json();
        const voteCount = await getReactionCount(post.id, "UPVOTE") - await getReactionCount(post.id, "DOWNVOTE");
        let userReaction = (await getReactions(post.id))?.type;
        const downvoteId = "_" + crypto.randomUUID();
        const upvoteId = "_" + crypto.randomUUID();
        const reactionCountId = "_" + crypto.randomUUID();

        function goToPost() {
            startLoading();
            setTimeout(() => {
                window.location.href = `post?id=${post.id}`;
            }, 800);
        }

        const postCards = summonTemplate("feed_post", {
            ".feed_post": { id: post.id },
            ".post_display_name": { text: post.display_name },
            ".post_desc": { text: post.description },
            ".tile_map": {
                style: {
                    backgroundImage: `url(/api/geoapify?lon=${encodeURIComponent(post.location.longitude)}&lat=${encodeURIComponent(post.location.latitude)})`
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
                onclick: () => goToPost()
            },
            ".post_status": {
                onclick: () => goToPost(),
                text: post.status === "RESOLVED" ? "Resolved" : "Open",
                style: {
                    display: "inline-block",
                    backgroundColor: post.status === "RESOLVED"
                        ? "rgba(70, 253, 70, 0.55)"
                        : "rgba(255, 255, 255, 0.3)",
                    cursor: "pointer"
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
            },
            ...(post.distance ? {
                ".interax_post_similarity": {
                    html: `Relevance: <b>${(convertSimilarity(post.distance)).toFixed(2)}%</b>`
                }
            } : {})
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
        bookmarks[post.id] = postCards
        for (const postCard of postCards.children) {
            postsContainer.appendChild(postCard);
        }

        //await waitASecond(250);
    }
}
export async function loadBookmarks(posts) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    let bookmarks = userData.bookmarks.map(e => e.id);
    const postsContainer = document.querySelector("#profile_bms_container");
    //document.querySelector("#post_loading_indicator").remove();
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
        const address = post.address_name
            ? {display_name: post.address_name}
            : await (await fetch(`/api/georeverse?lat=${post.location.latitude}&lon=${post.location.longitude}`)).json();
        const voteCount = await getReactionCount(post.id, "UPVOTE") - await getReactionCount(post.id, "DOWNVOTE");
        let userReaction = (await getReactions(post.id))?.type;
        const downvoteId = "_" + crypto.randomUUID();
        const upvoteId = "_" + crypto.randomUUID();
        const reactionCountId = "_" + crypto.randomUUID();

        function goToPost() {
            startLoading();
            setTimeout(() => {
                window.location.href = `post?id=${post.id}`;
            }, 800);
        }

        const postCards = summonTemplate("feed_post", {
            ".feed_post": { id: post.id },
            ".post_display_name": { text: post.display_name },
            ".post_desc": { text: post.description },
            ".tile_map": {
                style: {
                    backgroundImage: `url(/api/geoapify?lon=${encodeURIComponent(post.location.longitude)}&lat=${encodeURIComponent(post.location.latitude)})`
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
                onclick: () => goToPost()
            },
            ".post_status": {
                onclick: () => goToPost(),
                text: post.status === "RESOLVED" ? "Resolved" : "Open",
                style: {
                    display: "inline-block",
                    backgroundColor: post.status === "RESOLVED"
                        ? "rgba(70, 253, 70, 0.55)"
                        : "rgba(255, 255, 255, 0.3)",
                    cursor: "pointer"
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
            },
            ...(post.distance ? {
                ".interax_post_similarity": {
                    html: `Relevance: <b>${(convertSimilarity(post.distance)).toFixed(2)}%</b>`
                }
            } : {})
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

        //await waitASecond(250);
    }
}
let profilePic = null;
export async function loadProfileSetting() {
    const userData = await getCurrentUserData();
    const tmplt = await summonTemplate("profile_setting", {
        "#profile_avatar_preview": {
            img: userData.avatar,
        },
        "#profile_pic_input": {
            onchange: (evt) => {
                console.log("Selected file");
                const file = evt.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePic = e.target.result;
                    document.querySelector("#profile_avatar_preview").src = profilePic;
                    console.log("Image loaded:", profilePic);
                };
                reader.readAsDataURL(file);
            }
        },
        "#save_profile_pic_btn": {
            onclick: async (evt) => {
                if (!profilePic) {
                    summonToast("No image selected.");
                    return;
                }
                evt.target.disabled = true;
                evt.target.textContent = "Saving...";
                try {
                    const signature = await getSignature(crypto.randomUUID());
                    const img = await uploadToCloudinary(profilePic, signature);
                    await updateUserData({ avatar: img });
                    summonToast("Profile picture updated.");
                    document.querySelector("#profile_avatar").src = profilePic;

                } catch (error) {
                    summonToast("Error updating profile picture. Check console.");
                    console.error("Error updating profile picture:", error);
                } finally {
                    evt.target.disabled = false;
                    evt.target.textContent = "Save Profile Picture";
                }
            }
        },
        "#profile_name_input": {
            value: userData.first_name
        },
        "#profile_last_name_input": {
            value: userData.last_name
        },
        "#update_name_btn": {
            onclick: async (evt) => {
                const firstName = document.querySelector("#profile_name_input").value;
                const lastName = document.querySelector("#profile_last_name_input").value;
                if (!firstName || !lastName) {
                    summonToast("Name fields cannot be empty.");
                    return;
                } else if (firstName === userData.first_name && lastName === userData.last_name) {
                    summonToast("No changes detected.");
                    return;
                } else if (firstName.length > 50 || lastName.length > 50) {
                    summonToast("Name fields cannot exceed 50 characters.");
                    return;
                }

                evt.target.disabled = true;
                evt.target.textContent = "Updating...";
                try {
                    await updateUserData({ first_name: firstName, last_name: lastName });
                    summonToast("Profile name updated.");
                    document.querySelector(".profile_name").textContent = firstName + " " + lastName;
                } catch (error) {
                    summonToast("Error updating profile name. Check console.");
                    console.error("Error updating profile name:", error);
                } finally {
                    evt.target.disabled = false;
                    evt.target.textContent = "Update Name";
                }
            }
        },
        "#update_password_btn": {
            onclick: async (evt) => {
                const currentPassword = document.querySelector("#profile_current_password_input").value;
                const newPassword = document.querySelector("#profile_new_password_input").value;
                const confirmPassword = document.querySelector("#profile_new_password_confirm_input").value;

                if (!currentPassword || !newPassword || !confirmPassword) {
                    summonToast("All password fields are required.");
                    return;
                } else if (newPassword !== confirmPassword) {
                    summonToast("New passwords do not match.");
                    return;
                } else if (newPassword.length < 6) {
                    summonToast("New password must be at least 6 characters long.");
                    return;
                }

                evt.target.disabled = true;
                evt.target.textContent = "Updating...";
                try {
                    await changePassword(currentPassword, newPassword);
                    summonToast("Password updated successfully.");
                    document.querySelector("#profile_current_password_input").value = "";
                    document.querySelector("#profile_new_password_input").value = "";
                    document.querySelector("#profile_new_password_confirm_input").value = "";
                } catch (error) {
                    alert("Error updating password: " + error.message);
                    console.error("Error updating password:", error);
                } finally {
                    evt.target.disabled = false;
                    evt.target.textContent = "Update Password";
                }
            }
        }
    });
    document.querySelector(".feed_layer").appendChild(...tmplt.children);
}
export function logout() {
    auth.signOut();
}

window.summonToast = summonToast;


// ========================================================
// CURRENTLY UNUSED FUNCTIONS BUT MAY BE USEFUL LATER
// ========================================================
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