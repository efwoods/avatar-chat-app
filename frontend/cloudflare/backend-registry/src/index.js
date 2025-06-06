let backendUrl = null;

export default {
  async fetch(request) {
    const { method } = request;

    if (method === "POST") {
      try {
        const { backend_url } = await request.json();
        backendUrl = backend_url;
        return new Response(JSON.stringify({ status: "ok", backend_url }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    if (method === "GET") {
      if (!backendUrl) {
        return new Response(JSON.stringify({ error: "backend_url not set" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
      return new Response(JSON.stringify({ backend_url: backendUrl }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};

