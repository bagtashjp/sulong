export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "Missing latitude or longitude" }), { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;

  try {
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "SulongApp/1.0 (hjpbagtas@bpsu.edu.ph)",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch location data" }), { status: res.status });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}