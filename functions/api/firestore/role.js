import FirestoreREST from "./FirestoreREST";

const ROLES = ["USER", "LGU", "ADMIN", "BLOCKED"];

export async function onRequestPost(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const url = new URL(req.url);
    const params = url.searchParams;
    const userId = params.get("user_id");
    const newRole = params.get("new_role");
    if (!context.data.user.role || context.data.user.role !== 'ADMIN') {
        return new Response("Unauthorized", { status: 403 });
    }
    if (!newRole || !ROLES.includes(newRole)) {
        return new Response("Invalid new_role", { status: 400 });
    }
    if (!userId) return new Response("user_id is required", { status: 400 });
    const userDoc = await firestore.getDoc("users", userId);
    if (!userDoc) return new Response("User not found", { status: 404 });
    console.log("Updating role of user <", userId, "> to ", newRole);
    const data = {
        role: newRole
    };
    const res = await fetch(context.env.VECTOR_TOOL_URL + "/set-role", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId, new_role: newRole }),
    });
    if (res.ok) {
        await firestore.updateDoc("users", userId, data);
        return new Response(JSON.stringify(data), { status: 200 });
    } else {
        return new Response("Failed to update user role. " + await res.text(), { status: 500});
    }
    
}

      
