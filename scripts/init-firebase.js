// #region INIT 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    Timestamp,
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    query,
    limit,
    getDoc,
    doc,
    where,
    setDoc,
    getCountFromServer,
    addDoc,
    deleteDoc,
    orderBy,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { POST_TAG_NAME } from "./z_constants.js";
import { summonRightToast, summonToast } from "./utils.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCxz0u7fboXQWtjHThGjPWog_63XFAdn6M",
    authDomain: "sulong-app.firebaseapp.com",
    projectId: "sulong-app",
    storageBucket: "sulong-app.firebasestorage.app",
    messagingSenderId: "968461761887",
    appId: "1:968461761887:web:7ef17c9921e19035ef4aea",
    measurementId: "G-Z6G6DSVCR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const usersCache = {};
// #endregion

// #region POSTS
export async function createPost(postData) {
    const res = await fetch("/api/firestore/report", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + (await auth.currentUser.getIdToken()),
            "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
    });

    if (!res.ok) {
        // Optional: you can read error body if server returns JSON error details
        let errorMsg = `Error ${res.status}: ${res.statusText}`;
        try {
            const errData = await res.json();
            if (errData?.message) errorMsg += ` - ${errData.message}`;
        } catch (e) {
            // ignore JSON parse errors
        }
        alert(errorMsg);  // or console.error, or throw
        throw new Error(errorMsg);
    }

    return await res.json();  // safe to parse because res.ok === true
}

export async function getPosts(limitCount = 10) {
    try {
        const q = query(collection(db, "posts"),
            orderBy("created_at", "desc"),
            limit(limitCount));
        const querySnapshot = await getDocs(q);
        const posts = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

                if (usersCache[postData.user_id]) {
                    userName = usersCache[postData.user_id].name;
                    userAvatar = usersCache[postData.user_id].avatar;
                } else {
                    const userRef = doc(db, "users", postData.user_id);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : null;
                    if (userData) {
                        userName = userData.first_name + " " + userData.last_name;
                        userAvatar = userData.avatar || userAvatar;
                    }
                    usersCache[postData.user_id] = { name: userName, avatar: userAvatar };
                }
                return {
                    id: postDoc.id,
                    ...postData,
                    display_name: userName,
                    user_avatar: userAvatar
                };
            })
        );
        return posts;
    } catch (error) {
        console.error("Error getting posts with user: ", error);
        alert("Error getting pending posts. " + error);
        return [];
    }
}

export async function getPendingPosts(limitCount = 10) {
    try {
        const q = query(collection(db, "posts"),
            where("status", "==", "PENDING"),
            orderBy("created_at", "desc"),
            limit(limitCount));
        const querySnapshot = await getDocs(q);
        const posts = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

                if (usersCache[postData.user_id]) {
                    userName = usersCache[postData.user_id].name;
                    userAvatar = usersCache[postData.user_id].avatar;
                } else {
                    const userRef = doc(db, "users", postData.user_id);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : null;
                    if (userData) {
                        userName = userData.first_name + " " + userData.last_name;
                        userAvatar = userData.avatar || userAvatar;
                    }
                    usersCache[postData.user_id] = { name: userName, avatar: userAvatar };
                }
                return {
                    id: postDoc.id,
                    ...postData,
                    display_name: userName,
                    user_avatar: userAvatar
                };
            })
        );
        return posts;
    } catch (error) {
        console.error("Error getting posts with user: ", error);
        alert("Error getting pending posts. " + error);
        return [];
    }
}

export async function getApprovedPosts(limitCount = 10) {
    try {
        const q = query(
            collection(db, "posts"),
            where("status", "in", ["APPROVED", "RESOLVED"]),
            orderBy("created_at", "desc"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);

        const posts = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

                if (usersCache[postData.user_id]) {
                    userName = usersCache[postData.user_id].name;
                    userAvatar = usersCache[postData.user_id].avatar;
                } else {
                    const userRef = doc(db, "users", postData.user_id);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : null;
                    if (userData) {
                        userName = userData.first_name + " " + userData.last_name;
                        userAvatar = userData.avatar || userAvatar;
                    }
                    usersCache[postData.user_id] = { name: userName, avatar: userAvatar };
                }
                return {
                    id: postDoc.id,
                    ...postData,
                    display_name: userName,
                    user_avatar: userAvatar
                };
            })
        );

        return posts;
    } catch (error) {
        console.error("Error getting approved posts:", error);
        alert("Error getting approved posts. " + error);
        return [];
    }
}

export async function getPost(postId) {
    try {
        const postRef = doc(db, "posts", postId);
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data();
        let userName = "Unknown";
        let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

        if (usersCache[postData.user_id]) {
            userName = usersCache[postData.user_id].name;
            userAvatar = usersCache[postData.user_id].avatar;
        } else {
            const userRef = doc(db, "users", postData.user_id);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;
            if (userData) {
                userName = userData.first_name + " " + userData.last_name;
                userAvatar = userData.avatar || userAvatar;
            }
            userAvatar = userSnap.data().avatar || userAvatar;
            usersCache[postData.user_id] = { name: userName, avatar: userAvatar };
        }
        return {
            id: postDoc.id,
            ...postData,
            display_name: userName,
            user_avatar: userAvatar
        };
    } catch (error) {
        console.error("Error getting post:", error);
        alert("Error fetching post. " + error);
        return null;
    }
}

export async function getNotifications(limitCount = 10) {

    const userData = await getCurrentUserData();
    const bookmarks = userData.bookmarks || [];
    const notifications = [];
    for (const bookmark of bookmarks) {
        const q = query(
            collection(db, "notifications"),
            where("post_id", "==", bookmark.id),
            where("timestamp", ">", bookmark.timestamp),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        notifications.push(...querySnapshot.docs.map(doc => doc.data()));
    }
    console.log("Notifications:", notifications);
    notificationListener(bookmarks.map(b => b.id));
    return notifications;
}
export async function notificationListener(bookmarks) {
    const q = query(
        collection(db, "notifications"),
        where("post_id", "in", bookmarks)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`Snapshot received. Total matching documents: ${querySnapshot.size}`);

        querySnapshot.forEach((doc) => {
            const body = doc.data();
            let bodyBuilder = "";
            if (body.type === "POST_APPROVED") {
                bodyBuilder = "Your post has been approved!<br/><i>Click here to view.</i>";
            }
            summonRightToast(bodyBuilder, "/post?id=" + encodeURIComponent(body.post_id));
        });
    }, (error) => {
        console.error("Listener failed:", error);
    });
}
/*
export async function getPost(postId) {
try {
    const res = await fetch("/api/firestore/report?post_id=" + encodeURIComponent(postId), {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + (await auth.currentUser.getIdToken())
        }
    });
    if (!res.ok) throw new Error("Failed to fetch post");
    return await res.json();
} catch (error) {
    console.error("Error getting post:", error);
    alert("Error fetching post. " + error);
    return null;
}
}
*/
export async function updatePostStatus(docId, newStatus) {
    try {
        const postRef = doc(db, "posts", docId);
        await updateDoc(postRef, { status: newStatus });
        console.log(`Post ${docId} status updated to ${newStatus}`);
    } catch (error) {
        console.error("Error updating post status:", error);
    }
}

export async function approvePost(docId) {
    try {
        const res = await fetch("/api/firestore/post-approve?post_id=" + encodeURIComponent(docId), {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + (await auth.currentUser.getIdToken())
            }
        });
        if (!res.ok) throw new Error("Failed to approve post");
        return await res.json();
    } catch (error) {
        console.error("Error approving post:", error);
        alert("Error approving post. " + error);
        return null;
    }
}
// #endregion


// #region USERS
export async function doesUserExist(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    console.log("User exists:", userSnap.exists());
    return userSnap.exists();
}


export async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    // Main user data
    const userData = { id: userSnap.id, ...userSnap.data() };
    const { location, created_at, ...filteredData } = userData;

    // Fetch bookmarks subcollection
    const bookmarksCol = collection(userRef, "bookmarks");
    const bookmarksSnap = await getDocs(bookmarksCol);
    const bookmarks = bookmarksSnap.docs.map(docr => ({
        id: docr.id,
        ...docr.data()
    }));

    // Attach bookmarks to user data
    const result = { ...filteredData, bookmarks };

    // Optionally store in localStorage
    const userDataSerialized = JSON.stringify(result);
    localStorage.setItem("userData", userDataSerialized);
    return result;
}


export async function saveUserData(userData) {
    const user = auth.currentUser;

    if (!user) {
        console.error("No authenticated user!");
        return;
    }

    const userRef = doc(db, "users", user.uid);

    await setDoc(userRef, {
        ...userData,
        email: user.email,
        created_at: serverTimestamp(),
    }, { merge: true });
}

export async function removeBookmark(postId) {
    const res = await fetch("/api/firestore/bookmark?post_id=" + encodeURIComponent(postId), {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + (await auth.currentUser.getIdToken())
        }
    });
    if (!res.ok) {
        alert("Error deleting bookmark.");
        throw new Error("Failed to delete bookmark");
    }
}

export async function addBookmark(postId) {
    const res = await fetch("/api/firestore/bookmark?post_id=" + encodeURIComponent(postId), {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + (await auth.currentUser.getIdToken())
        }
    });
    if (!res.ok) {
        alert("Error adding bookmark.");
        throw new Error("Failed to add bookmark");
    }
}
// #endregion

// #region COMMENTS
export async function getComments(postId, commentLimit = 100) {
    try {
        const commentsCol = collection(db, "posts", postId, "comments");
        const commentsQuery = query(
            commentsCol,
            limit(commentLimit)
        );

        const commentsSnap = await getDocs(commentsQuery);
        const comments = await Promise.all(
            commentsSnap.docs.map(async (commentDoc) => {
                const commentData = commentDoc.data();

                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

                if (commentData.user_id) {
                    if (usersCache[commentData.user_id]) {
                        userName = usersCache[commentData.user_id].name;
                        userAvatar = usersCache[commentData.user_id].avatar;
                    } else {
                        const userRef = doc(db, "users", commentData.user_id);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            const user = userSnap.data();
                            userName = `${user.first_name} ${user.last_name}`;
                            userAvatar = user.avatar || userAvatar;
                        }
                        usersCache[commentData.user_id] = { name: userName, avatar: userAvatar };
                    }
                }

                return {
                    id: commentDoc.id,
                    ...commentData,
                    display_name: userName,
                    user_avatar: userAvatar
                };
            })
        );

        return comments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

export async function setComment(postId, body) {
    try {
        const userId = auth.currentUser.uid;
        const commentsCol = collection(db, "posts", postId, "comments");
        await addDoc(commentsCol, {
            body: body,
            user_id: userId,
            timestamp: serverTimestamp()
        });

        console.log("Comment added successfully!");
    } catch (error) {
        console.error("Error adding comment:", error);
    }
}
// #endregion

// #region PROGRESS
export async function setProgress(postId, body, media = []) {
    try {
        const user_id = auth.currentUser.uid;
        const progress_collection = collection(db, "posts", postId, "progress");
        const docRef = await addDoc(progress_collection, {
            body,
            media,
            user_id,
            timestamp: serverTimestamp()
        });
        // Re-fetch to get the resolved timestamp
        const snap = await getDoc(docRef);
        const data = snap.data();

        console.log("Progress added successfully!", data.timestamp.toDate());
        return data.timestamp;
    } catch (error) {
        console.error("Error adding progress:", error);
    }
}

export async function getProgress(postId, progressLimit = 100) {
    try {
        const progressCol = collection(db, "posts", postId, "progress");
        const progressQuery = query(
            progressCol,
            orderBy("timestamp", "desc"),
            limit(progressLimit)
        );

        const progressSnap = await getDocs(progressQuery);
        const progressItems = await Promise.all(
            progressSnap.docs.map(async (progressDoc) => {
                const progressData = progressDoc.data();

                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";

                if (progressData.user_id) {
                    if (usersCache[progressData.user_id]) {
                        userName = usersCache[progressData.user_id].name;
                        userAvatar = usersCache[progressData.user_id].avatar;
                    } else {
                        const userRef = doc(db, "users", progressData.user_id);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            const user = userSnap.data();
                            userName = `${user.first_name} ${user.last_name}`;
                            userAvatar = user.avatar || userAvatar;
                        }
                        usersCache[progressData.user_id] = { name: userName, avatar: userAvatar };
                    }
                }

                return {
                    id: progressDoc.id,
                    ...progressData,
                    display_name: userName,
                    user_avatar: userAvatar
                };
            })
        );

        return progressItems;
    } catch (error) {
        console.error("Error fetching progress:", error);
        return [];
    }
}

export async function markPostResolved(postId) {
    try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            status: "RESOLVED",
        });
    } catch (error) {
        console.error("Error marking post as resolved:", error);
    }
}

// #endregion

// #region REACTIONS
export async function getReactions(postId) {
    try {
        const userId = auth.currentUser.uid;
        const reactionRef = doc(db, "posts", postId, "reactions", userId);
        const reactionSnap = await getDoc(reactionRef);
        return reactionSnap.exists() ? reactionSnap.data() : null;
    } catch (error) {
        console.error("Error getting user post reaction:", error);
        return null;
    }
}

export async function setReaction(postId, reactionType) {
    try {
        const userId = auth.currentUser.uid;
        const reactionRef = doc(db, "posts", postId, "reactions", userId);
        await setDoc(reactionRef, { type: reactionType, timestamp: Date.now() });
    } catch (error) {
        console.error("Error setting reaction:", error);
    }
}

export async function updateReaction(postId, newReaction) {
    try {
        const userId = auth.currentUser.uid;
        const reactionRef = doc(db, "posts", postId, "reactions", userId);
        await updateDoc(reactionRef, { type: newReaction, timestamp: serverTimestamp() });
    } catch (error) {
        console.error("Error updating reaction:", error);
    }
}

export async function removeReaction(postId) {
    try {
        const userId = auth.currentUser.uid;
        const reactionRef = doc(db, "posts", postId, "reactions", userId);
        await deleteDoc(reactionRef);
    } catch (error) {
        console.error("Error deleting reaction:", error);
    }
}

export async function getReactionCount(postId, reactionType = "UPVOTE") {
    const reactionsCol = collection(db, "posts", postId, "reactions");

    const reactionQuery = query(
        reactionsCol,
        where("type", "==", reactionType),
        limit(100)
    );

    const countSnap = await getCountFromServer(reactionQuery);
    const count = countSnap.data().count;
    return count;
}

// #endregion

// #region ANALYTICS

function startOfMonth(y, m) {
    return Timestamp.fromDate(new Date(y, m - 1, 1));
}

function startOfNextMonth(y, m) {
    return Timestamp.fromDate(new Date(y, m, 1));
}
export async function getMonthlyCounts(year = 2025) {
    const counts = [];

    for (let month = 1; month <= 12; month++) {
        const q = query(
            collection(db, "posts"),
            where("created_at", ">=", startOfMonth(year, month)),
            where("created_at", "<", startOfNextMonth(year, month))
        );
        const snapshot = await getCountFromServer(q);
        counts.push(snapshot.data().count);
    }

    return counts;
}

export async function getCategoryCounts() {
    const catTags = Object.keys(POST_TAG_NAME);
    const cats = [];
    for (const tag of catTags) {
        const q = query(
            collection(db, "posts"),
            where("category", "==", tag)
        );
        const snapshot = await getCountFromServer(q);
        cats.push(snapshot.data().count);
    }
    return cats;
}

export async function sendPasswordResetRequest(email) {
    try {
        if (!email || typeof email !== "string" || !email.includes("@")) {
            throw new Error("Please provide a valid email address.");
        }
        await sendPasswordResetEmail(auth, email.trim());
        console.log("Password reset email sent to:", email);
        return { success: true };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        alert("Failed to send password reset email: " + (error.message || error));
        return { success: false, error };
    }
}