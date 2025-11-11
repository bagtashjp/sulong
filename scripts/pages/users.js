import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, initNotifications } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { getPosts, auth, doesUserExist, getMonthlyCounts, getCategoryCounts, getUsers, changeUserRole } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";

document.addEventListener("DOMContentLoaded", async () => {
    await renderCards();
    await renderCardsAsync(["user_container"]);
    initDarkmode();
    initAuthState(async () => {
        if (!(await doesUserExist(auth.currentUser.uid))) {
            window.location.href = "signin";
            return;
        }
        initNotifications();
        endLoading();
        loadUsers();
        document.querySelector("#anav-management-toggle").checked = true;
    }, () => {
        window.location.href = "signin";
    })
    initNavBars();
    setTimeout(() => delayHrefs(), 500);
});
let filterByDate = "desc";
let filterByRole = "";
async function loadUsers(isOffset = false) {
    const limiter = 2;
    let users = await getUsers(filterByDate, filterByRole, limiter, isOffset);
    const usersContainer = document.querySelector(".users_list");
    for (const user of users) {
        const userCard = summonTemplate("user_container", {
            ".users_user_icon": { img: user.avatar },
            ".users_user_display_name": { text: user.first_name + " " + user.last_name },
            ".change_user_role": { id: `user_${user.id}`, onclick: async function(evt) {
                evt.target.disabled = true;
                const roleElement = document.querySelector(`#role_${user.id}`);
                const newRole = roleElement.value.toUpperCase();
                const ok = await changeUserRole(user.id, newRole).then(() => {
                    evt.target.style.display = "none";
                    user.role = newRole;
                });
                    evt.target.disabled = false;
                
            }},
            ".users_user_role": {
                id: `role_${user.id}`,
                value: user.role.toUpperCase(),
                onchange: function (e) {
                    console.log(e.target.value, user.role);
                    if (e.target.value.toUpperCase() !== user.role) {
                        document.querySelector(`#user_${user.id}`).style.display = "inline-block";
                    } else {
                        document.querySelector(`#user_${user.id}`).style.display = "none";
                    }
                }
             },

        });
        usersContainer.appendChild(...userCard.children);
    }
    if (users.length >= limiter) {
        document.querySelector("#load_more_users_button").style.display = "block";
    } else {
        document.querySelector("#load_more_users_button").style.display = "none";
    }
}


window.applyFilters = async function applyFilters() {
    filterByDate = document.querySelector("#filter_by_date").value;
    filterByRole = document.querySelector("#filter_by_role").value.toUpperCase();
    document.querySelector(".users_list").innerHTML = "";
    loadUsers();
}
window.loadMoreUsers = async function loadMoreUsers(btn) {
    btn.style.display = "none";
    loadUsers(true);
}