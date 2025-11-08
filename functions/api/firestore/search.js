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
    const results = await firestore.vectorFinder("posts", embedding, {
        limit: 10,
        vectorField: "embeddings",
        distanceMeasure: "COSINE",
        distanceResultField: "distance",
        distanceThreshold: 0.3,
        where: {
            fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'NOT_EQUAL',
                value: { stringValue: 'REJECTED' }
            }
        }
    });
    console.log("Search results:", results);
    return new Response(JSON.stringify(results), { status: 200 });
}