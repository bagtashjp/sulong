import { jwtVerify, createRemoteJWKSet } from 'jose';

const FIREBASE_PROJECT_ID = 'sulong-app';
const JWKS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export async function onRequest(context) {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // 1. Try to get JWKS from KV
    let jwksRaw = await context.env.JWKS_KV.get('firebase-jwks');
    if (!jwksRaw) {
        // Fetch and cache if not present
        const res = await fetch(JWKS_URL);
        jwksRaw = await res.text();
        // Store in KV for 1 hour
        await context.env.JWKS_KV.put('firebase-jwks', jwksRaw, { expirationTtl: 3600 });
    }

    const firebaseJwks = createRemoteJWKSet(new URL('data:application/json,' + encodeURIComponent(jwksRaw)));

    try {
        const { payload } = await jwtVerify(token, firebaseJwks, {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        });
        context.user = payload;
        await context.next();
    } catch (err) {
        return new Response('Unauthorized', { status: 401 });
    }
}
