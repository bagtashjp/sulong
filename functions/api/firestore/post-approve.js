import FirestoreREST from "./FirestoreREST";
export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    if (!context.data.user.role || context.data.user.role !== 'ADMIN') {
        return new Response("Unauthorized", { status: 403 });
    }
    if (!postId) return new Response("post_id is required", { status: 400 });
    const postDoc = await firestore.getDoc("posts", postId);
    if (!postDoc) return new Response("Report not found", { status: 404 });

    const data = {
        status: "APPROVED"
    };
    await firestore.updateDoc("posts", postId, data);
    await firestore.addDoc("notify_user", {
        user_id: postDoc.user_id,
        type: "POST_APPROVED",
        link: postId
    });
    return new Response(JSON.stringify(data), { status: 200 });
}