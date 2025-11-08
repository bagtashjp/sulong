import FirestoreREST from "./FirestoreREST";

export async function onRequestDelete(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    const user = context.data.user;


    try {
        await firestore.deleteDoc(`users/${user.sub}/bookmarks`, postId);
        return new Response("Bookmark removed", { status: 200 });
    } catch (e) {
        console.error("Error removing bookmark:", e);
        return new Response("Error removing bookmark", { status: 500 });
    }


}

export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    const user = context.data.user;
    
    try {
        await firestore.setDoc(`users/${user.sub}/bookmarks`, postId, {
            timestamp: new Date()
        });
        return new Response("Bookmark added", { status: 200 });
    } catch (e) {
        console.error("Error adding bookmark:", e);
        return new Response("Error adding bookmark", { status: 500 });
    }
}