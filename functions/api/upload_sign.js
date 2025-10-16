export async function onRequest({ request, env }) {
	const APISecret = env.CLOUDINARY_SECRET;
	const body = await request.json(); // Thank you AI :>
	const timestamp = Math.floor(Date.now() / 1000);
	const data = `public_id=${body.public_id}&timestamp=${timestamp}`;
	const signature = await sha1(data + APISecret);
	return new Response(JSON.stringify({signature, timestamp}));
}

async function sha1(message) {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-1', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
