import crypto from "node:crypto";
export async function onRequest(context) {
    console.log(crypto.constants.SSL_OP_NO_TICKET);
    return new Response("Hello from create-post!");
}