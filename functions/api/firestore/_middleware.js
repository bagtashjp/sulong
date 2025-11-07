import { jwtVerify, createRemoteJWKSet } from 'jose'; 

const FIREBASE_PROJECT_ID = 'sulong-app';
const JWKS_URI = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export async function onRequest(context) {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Token Expected', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await jwtVerify(token, remoteJWKS, {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        });
        
        context.data.user = payload;
        console.log("JWT verified for user:", context.data.user);
        return await context.next();
        
    } catch (err) {
        console.log("JWT Verification Error:", err);
        return new Response('Bearer token invalid', { status: 401 });
    }
}