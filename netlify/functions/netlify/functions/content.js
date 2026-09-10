const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("burger-site");
  const headers = { "Content-Type": "application/json" };

  if (event.httpMethod === "GET") {
    const data = await store.get("content", { type: "json" });
    return { statusCode: 200, headers, body: JSON.stringify(data || null) };
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad request" }) };
    }

    // Password is checked here, on the server — it never ships in the
    // page source, unlike the earlier client-side-only version.
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Wrong password" }) };
    }

    // Login screen calls this with verifyOnly:true just to check the
    // password, without writing anything.
    if (body.verifyOnly) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    await store.setJSON("content", body.content);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
