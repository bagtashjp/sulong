import * as jose from "jose";
export async function onRequest(context) {
    console.log(typeof jose.generateSecret)
    return new Response("Hello from create-post!");
}