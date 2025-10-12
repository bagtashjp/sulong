import { jwtVerify } from 'jose';

export async function onRequest() {
  if (typeof jwtVerify === 'function') {
    console.log("It's working maybe");
    return new Response("jose module is working!");
  } else {
    console.log("OHH MY GOD");
    return new Response("IT'S NOT WORKING!!!");
  }
}