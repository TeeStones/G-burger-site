const { kv } = require("@vercel/kv");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const data = await kv.get("content");
    return res.status(200).json(data || null);
  }

  if (req.method === "POST") {
    // Vercel parses a JSON request body into req.body automatically when
    // the request's Content-Type is application/json, but guard against
    // it arriving as a raw string just in case.
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (e) {
        return res.status(400).json({ error: "Bad request" });
      }
    }
    body = body || {};

    // Password is checked here, on the server - it never ships in the
    // page source, unlike the earlier client-side-only version.
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // Login screen calls this with verifyOnly:true just to check the
    // password, without writing anything.
    if (body.verifyOnly) {
      return res.status(200).json({ ok: true });
    }

    await kv.set("content", body.content);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
