import FirestoreREST from "./FirestoreREST";
import { getEmbedding } from "./googleai";
export async function onRequest(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const query = params.get("query");
    if (!query) return new Response("query is required", { status: 400 });
    const embedding = await getEmbedding(context.env.GOOGLE_AI_KEY_A,
        "gemini-embedding-001",
        query,
        "RETRIEVAL_QUERY"
    );
    console.log(embedding.join("|"))
    if (!embedding) return new Response("Failed to generate embedding", { status: 500 });
    const res = await fetch(context.env.VECTOR_TOOL_URL + "/vector-search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vector: embedding })
    })
    if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } else {
        return new Response("Internal Server Error", { status: 500});
    }
}