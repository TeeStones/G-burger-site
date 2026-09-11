const { Redis } = require("@upstash/redis");

// Vercel's Upstash Marketplace integration injects KV_REST_API_URL /
// KV_REST_API_TOKEN when Vercel manages the Upstash account, or
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN when you connect your
// own Upstash account - this covers either case.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const data = await redis.get("content");
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

    await redis.set("content", body.content);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
