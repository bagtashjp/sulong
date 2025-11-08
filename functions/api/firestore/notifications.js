import FirestoreREST from "./FirestoreREST";
export async function onRequestGet(context) {
    const firestore = new FirestoreREST(context.env);
    const req = context.request;
    const user = context.data.user;
    let userName = "Unknown";
    let userAvatar = "https://res.cloudinary.com/dxdmjp5zr/image/upload/v1760607661/edfff15a-48da-4e29-8eb3-27000d3d3ead.png";
    
    const userDoc = await firestore.getDoc("users", user.sub);
    const bookMarks = userDoc.bookMarks || [];
    let notifs = [];
    if (bookMarks.length > 0) {
        const queryBody = {
            where: {
                fieldFilter: {
                    field: { fieldPath: "post_id" },
                    op: "IN",
                    value: { arrayValue: { values: bookMarks.map(b => ({ stringValue: b })) } }
                }
            }
        };
        const queryDocs = await firestore.getDocs("notify_user", queryBody);
        notifs = queryDocs;
    }

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