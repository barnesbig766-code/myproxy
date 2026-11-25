const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

// Configure permitted website domains in Render's
// ALLOWED_HOSTS environment variable.
const allowedHosts = (
  process.env.ALLOWED_HOSTS || ""
)
  .split(",")
  .map(host => host.trim().toLowerCase())
  .filter(Boolean);

app.get("/", (req, res) => {
  res.send(`
    <h1>My Proxy Server</h1>
    <p>Your proxy backend is running!</p>
  `);
});

app.get("/api/fetch", async (req, res) => {
  try {
    const rawUrl = req.query.url;

    if (!rawUrl) {
      return res.status(400).json({
        error: "Please provide a URL."
      });
    }

    let target;

    try {
      target = new URL(rawUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL."
      });
    }

    if (target.protocol !== "https:") {
      return res.status(400).json({
        error: "Only HTTPS URLs are supported."
      });
    }

    const hostname = target.hostname.toLowerCase();

    if (!allowedHosts.some(host =>
      hostname === host ||
      hostname.endsWith("." + host)
    )) {
      return res.status(403).json({
        error: "This domain is not permitted."
      });
    }

    const response = await fetch(target.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "MyProxy/1.0"
      }
    });

    // Don't follow redirects to unapproved destinations.
    if (response.status >= 300 &&
        response.status < 400) {
      return res.status(502).json({
        error: "Redirects are not supported."
      });
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("text/") &&
        !contentType.includes("json") &&
        !contentType.includes("xml")) {
      return res.status(415).json({
        error: "Unsupported content type."
      });
    }

    const body = await response.text();

    res.status(response.status);
    res.type(contentType);
    res.send(body);

  } catch (error) {
    res.status(500).json({
      error: "Could not fetch the requested page."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy running on port ${PORT}`);
});

