export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}&limit=5`;

  const res = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "SulongApp/1.0 (hjpbagtas@bpsu.edu.ph)",
    },
  });

  const data = await res.json();
  console.log("Geocode Data:", data);
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
