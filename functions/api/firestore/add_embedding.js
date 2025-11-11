// This is just temporary, to add to old posts' embeddings
import FirestoreREST from "./FirestoreREST";
import { getEmbedding } from "./googleai";
export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const postId = params.get("post_id");
    if (!postId) return new Response("post_id is required", { status: 400 });
    const postDoc = await firestore.getDoc("posts", postId);
    if (!postDoc) return new Response("Report not found", { status: 404 });
    const description = postDoc.description;
    const embedding = await getEmbedding(context.env.GOOGLE_AI_KEY_A, "gemini-embedding-001", description);
    if (!embedding) return new Response("Failed to generate embedding", { status: 500 });
    const res = await fetch(context.env.VECTOR_TOOL_URL + "/embed", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ post_id: postId, embedding })
    })
    if (res.ok) {
        return new Response("Embedding added", { status: 200 });
    } else {
        return new Response("Internal Server Error", { status: 500});
    }
}