export const onRequestPost: PagesFunction = async (ctx) => {
  const workerUrl = "https://sbvcount.saurabhshrivastava224.workers.dev/";

  // Read incoming JSON from browser
  const body = await ctx.request.json();

  // Forward to Worker (server-side)
  const resp = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Optional: if you want to protect Worker with token,
      // store it in Pages env vars as WORKER_AUTH_TOKEN.
      ...(ctx.env.WORKER_AUTH_TOKEN
        ? { authorization: `Bearer ${ctx.env.WORKER_AUTH_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
  });

  // Return worker response to browser
  return new Response(await resp.text(), {
    status: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json",
      "access-control-allow-origin": "*",
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
};
