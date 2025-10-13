import { jwtVerify, createRemoteJWKSet } from 'jose';

export async function onRequest({ request }) {
    return new Response("wow")
}
