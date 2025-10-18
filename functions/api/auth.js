import { jwtVerify, createRemoteJWKSet } from 'jose';

const firebaseJwks = createRemoteJWKSet(
    new URL('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
);

const FIREBASE_PROJECT_ID = 'sulong-app';
export async function verifyUser(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return 401;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await jwtVerify(token, firebaseJwks, {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        });
        return 200;
    } catch (err) {
        return 500;
    }
}
