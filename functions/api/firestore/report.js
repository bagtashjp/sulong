import FirestoreREST from "./FirestoreREST";
import { getEmbedding, moderateContent } from "./googleai";
import { URL } from 'node:url';
export async function onRequestGet(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    if (!postId) return new Response("post_id is required", { status: 400 });
    const postDoc = await firestore.getDoc("posts", postId);
    if (!postDoc) return new Response("Report not found", { status: 404 });

    let userName = "Unknown";
    let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";
    console.log(JSON.stringify(postDoc));
    let userId = postDoc.user_id;
    if (userId) {
        const userDoc = await firestore.getDoc("users", userId);
        if (userDoc) {
            userName = userDoc.first_name + " " + userDoc.last_name || userName;
            userAvatar = userDoc.avatar || userAvatar;
        }
    }
    const newDoc = {
        id: postDoc.id,
        ...postDoc,
        display_name: userName,
        user_avatar: userAvatar
    }

    return new Response(JSON.stringify(newDoc), { status: 200 });
}

export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const user = context.data.user;
    let data;
    try {
        data = await req.json();
    } catch (e) {
        return new Response("Invalid JSON", { status: 500 });
    }
    if (!data) return new Response("Invalid request body", { status: 500 });
    //const moderation = await moderateContent(context.env.GOOGLE_AI_KEY_A, "gemini-2.5-flash", data.description, data.media);
    //if (moderation.score < 0.3) {
    //    return new Response("Your report has been auto-rejected by AI moderation.\nReason: " + moderation.reason, { status: 400 });
    //} else if (moderation.score > 0.7) {
    //    data.status = "APPROVED";
    //} else {
        data.status = "PENDING";
        data.embeddings = null;
    //}
    data.created_at = new Date();
    //const embedding = await getEmbedding(context.env.GOOGLE_AI_KEY_A, "gemini-embedding-001", data.description);
    try {
        const res = await firestore.addDoc("posts", data);
        const postId = res.name.split("/").pop();
        try {
            await firestore.setDoc(`users/${user.sub}/bookmarks`, postId, {
                timestamp: new Date()
            });
            
            const uri = context.env.VECTOR_TOOL_URL + "/embed";
            console.log("Embedding URL:", uri);
            try {
                const res = await fetch(uri, {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ post_id: postId, description })
                });
                console.log("Embedding status: " + res.status);
                console.log("Embedding response:", await res.text());
            } catch (err) {
                console.error("Error sending embedding:", err);
            }
            if (data.status === "APPROVED") {
                return new Response(JSON.stringify({ id: postId }), { status: 201 });
            } else {
                return new Response(JSON.stringify({ id: postId }), { status: 202 });
            }
            
        } catch (e) {
            console.error("Error adding bookmark:", e);
            return new Response("Error adding bookmark", { status: 500 });
        }

    } catch (e) {
        console.error("Error creating post:", e);
        return new Response("Error creating post", { status: 500 });
    }

}

