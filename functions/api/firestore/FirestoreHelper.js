import * as jose from 'jose';

const TOKEN_TTL = 3600; // 1 hour

async function getAccessToken(env) {
    // Check KV for cached token
    const cached = await env.FIRESTORE_TOKEN.get("access_token");
    if (cached) return cached;

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + TOKEN_TTL;

    const payload = {
        iss: env.CLIENT_EMAIL,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat,
        exp
    };

    // Sign JWT using RS256
    const privateKey = env.PRIVATE_KEY.replace(/\\n/g, "\n");
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .sign(await jose.importPKCS8(privateKey, "RS256"));

    // Exchange JWT for access token
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    const data = await res.json();
    if (!data.access_token) throw new Error("Failed to get access token");

    // Store in KV
    await env.FIRESTORE_TOKEN.put("access_token", data.access_token, { expirationTtl: TOKEN_TTL - 60 });

    return data.access_token;
}

export async function firestoreRequest(env, method, path, body = null) {
    const token = await getAccessToken(env);
    const url = `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/${path}`;

    const res = await fetch(url, {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Firestore Error: ${res.status} ${res.statusText} ${JSON.stringify(err)}`);
    }

    return res.json();
}

/**
 * Usage examples:
 * 
 * const doc = await firestoreRequest(env, "GET", "documents/myCollection/myDocId");
 * const newDoc = await firestoreRequest(env, "POST", "documents/myCollection", {
 *   fields: { name: { stringValue: "John" }, age: { integerValue: 30 } }
 * });
 */
