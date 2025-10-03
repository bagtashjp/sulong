import * as jose from "jose";
export async function onRequest(context) {
  // context.request is the Request object
  return new Response("Hello from create-post!");
}