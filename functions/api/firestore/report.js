import FirestoreREST from "./FirestoreREST";
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
    
}