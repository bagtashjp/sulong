import FirestoreREST from "./FirestoreREST";
import { getEmbedding } from "./googleai";
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
        return new Response("Invalid JSON", { status: 400 });
    }
    if (!data) return new Response("Invalid request body", { status: 400 });
    data.created_at = new Date();
    data.status = "PENDING";
    const embedding = await getEmbedding(context.env.GOOGLE_AI_KEY_A, "gemini-embedding-001", data.description);
    try {
        const res = await firestore.addDoc("posts", data);
        const postId = res.name.split("/").pop();
        try {
            await firestore.setDoc(`users/${user.sub}/bookmarks`, postId, {
                timestamp: new Date()
            });
            const res = await fetch(context.env.VECTOR_TOOL_URL + "/embed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ post_id: postId, embedding })
            })
            if (res.ok) {
                return new Response(JSON.stringify({ id: postId }), { status: 200 });
            } else {
                return new Response("Internal Server Error", { status: 500 });
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
