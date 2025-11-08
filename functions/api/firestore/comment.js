import FirestoreREST from "./FirestoreREST";
export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    const body = await req.json();
    if (!postId) return new Response("post_id is required", { status: 400 });
    if (!body || !body.text) return new Response("body is required", { status: 400 });
    const user = context.data.user;
    const postDoc = await firestore.getDoc("posts", postId);
    if (!postDoc) return new Response("Post not found", { status: 404 });
    await firestore.addDoc(`posts/${postId}/comments`, {
        body: body.text,
        user_id: user.sub,
        timestamp: new Date()
    });
    await firestore.addDoc("notifications", {
        post_id: postId,
        post_description: postDoc.description,
        type: "NEW_COMMENT",
        timestamp: new Date()
    });
    return new Response("Comment added", { status: 200 });
}

