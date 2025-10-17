// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, updateDoc, query, limit, getDoc, doc, where, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
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
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export async function getPendingPosts(limitCount = 10) {
    try {
        const q = query(collection(db, "posts"),
            where("status", "==", "PENDING"),
            limit(limitCount));
        const querySnapshot = await getDocs(q);
        const posts = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let userName = "Unknown";

                const userRef = doc(db, "users", postData.user_id);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    userName = userSnap.data().first_name + " " + userSnap.data().last_name;
                }
                return {
                    id: postDoc.id,
                    ...postData,
                    display_name: userName
                };
            })
        );

        return posts;
    } catch (error) {
        console.error("Error getting posts with user:", error);
        return [];
    }
}

export async function getApprovedPosts(limitCount = 10) {
    try {
        const q = query(
            collection(db, "posts"),
            where("status", "==", "APPROVED"),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);

        const posts = await Promise.all(
            querySnapshot.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let userName = "Unknown";
                let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";
                const userRef = doc(db, "users", postData.user_id);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    userName = userSnap.data().first_name + " " + userSnap.data().last_name;
                    userAvatar = userSnap.data().avatar || userAvatar;
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
        return [];
    }
}

export async function updatePostStatus(docId, newStatus) {
    try {
        const postRef = doc(db, "posts", docId);
        await updateDoc(postRef, { status: newStatus });
        console.log(`Post ${docId} status updated to ${newStatus}`);
    } catch (error) {
        console.error("Error updating post status:", error);
    }
}

export async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = { id: userSnap.id, ...userSnap.data() };
        const { location, created_at, ...filteredData } = userData;
        const userDataSerialized = JSON.stringify(filteredData);
        localStorage.setItem("userData", userDataSerialized);
        return filteredData;
    } else {
        return null;
    }
}

export async function doesUserExist(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    console.log("User exists:", userSnap.exists());
    return userSnap.exists();
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
        createdAt: new Date(),
    }, { merge: true }); 
}
