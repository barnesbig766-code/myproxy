const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

const allowedHost = "coolmathgames.com";

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MyProxy</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #090d18;
  color: white;
  font-family: Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  width: 90%;
  max-width: 650px;
  text-align: center;
}

.logo {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 10px;
}

.logo span {
  color: #6c8cff;
}

.subtitle {
  color: #9ba8c7;
  margin-bottom: 35px;
}

.search-box {
  display: flex;
  background: #151d30;
  padding: 8px;
  border: 1px solid #293653;
  border-radius: 15px;
  gap: 8px;
}

input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  padding: 14px;
  font-size: 16px;
}

button {
  background: #6c8cff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

button:hover {
  background: #5275f5;
}

.info {
  margin-top: 25px;
  color: #7886a5;
  font-size: 13px;
}

</style>
</head>

<body>

<div class="container">

  <div class="logo">
    My<span>Proxy</span>
  </div>

  <div class="subtitle">
    Your little gateway to the web.
  </div>

  <form
    class="search-box"
    action="/api/fetch"
    method="GET"
    target="_blank"
  >

    <input
      type="url"
      name="url"
      placeholder="https://www.coolmathgames.com/"
      required
    >

    <button type="submit">
      Browse
    </button>

  </form>

  <div class="info">
    Currently supports Coolmath Games URLs.
  </div>

</div>

</body>
</html>
  `);
});

app.get("/api/fetch", async (req, res) => {
  try {
    if (!req.query.url) {
      return res.status(400).send("Enter a URL.");
    }

    const target = new URL(req.query.url);

    if (target.protocol !== "https:") {
      return res.status(400).send("HTTPS only.");
    }

    const host = target.hostname.toLowerCase();

    if (
      host !== allowedHost &&
      !host.endsWith("." + allowedHost)
    ) {
      return res.status(403).send(
        "Only Coolmath Games is allowed."
      );
    }

    const response = await fetch(target.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000)
    });

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      return res.status(502).send(
        "This page redirected. Try the main website."
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return res.status(415).send(
        "This proxy currently supports HTML pages."
      );
    }

    const html = await response.text();

    res.type("html").send(html);

  } catch (error) {
    res.status(500).send(
      "Could not load this page."
    );
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("MyProxy is running!");
});

