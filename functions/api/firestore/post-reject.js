import FirestoreREST from "./FirestoreREST";
export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    const reason = params.get("reason");
    if (!context.data.user.role || context.data.user.role !== 'ADMIN') {
        return new Response("Unauthorized", { status: 403 });
    }
    if (!reason) return new Response("reason is required", { status: 400 });
    if (!postId) return new Response("post_id is required", { status: 400 });
    const postDoc = await firestore.getDoc("posts", postId);
    if (!postDoc) return new Response("Report not found", { status: 404 });
    const data = {
        status: "REJECTED"
    };
    await firestore.updateDoc("posts", postId, data);
    await firestore.addDoc("notifications", {
        post_id: postId,
        post_description: postDoc.description || "",
        type: "POST_REJECTED",
        reason: reason,
        timestamp: new Date()
    });
    return new Response(JSON.stringify(data), { status: 200 });
}
