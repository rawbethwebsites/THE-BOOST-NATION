import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const BRANDING_RECIPIENT = process.env.BRANDING_RECIPIENT || "rawbethwebsites@gmail.com";

app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Server misconfiguration: missing OPENROUTER_API_KEY." });
  }

  const userMessage = (req.body && req.body.message) || "";
  if (!userMessage.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter:meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("OpenRouter error:", error);
      return res.status(502).json({ error: "Upstream error", detail: error });
    }

    const data = await response.json();
    const aiMessage = data?.choices?.[0]?.message?.content || "I’m here and ready to help.";
    return res.json({ message: aiMessage });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.post("/api/branding", async (req, res) => {
  if (!BRANDING_RECIPIENT) {
    return res.status(500).json({ error: "Form recipient not configured." });
  }

  const payload = req.body || {};

  try {
    const params = new URLSearchParams({
      _subject: `New Instagram Branding Submission — ${payload.fullName || "Unknown"}`,
      _captcha: "false",
      ...payload
    });

    const upstream = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(BRANDING_RECIPIENT)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Referer: "https://theboostnation.com/branding.html"
      },
      body: params.toString()
    });

    if (!upstream.ok) {
      const detailText = await upstream.text().catch(() => "");
      const detail = (() => {
        try {
          return JSON.parse(detailText);
        } catch {
          return null;
        }
      })();
      console.error("FormSubmit error", { status: upstream.status, detail: detail || detailText });
      return res
        .status(502)
        .json({ error: detail?.message || detailText || "Upstream form service error.", status: upstream.status });
    }

    const data = await upstream.json().catch(() => null);
    if (data && data.success === "false") {
      return res.status(502).json({ error: data.message || "Form service error." });
    }

    res.json({ ok: true, forwardedTo: BRANDING_RECIPIENT });
  } catch (err) {
    console.error("Branding submit proxy failed", err);
    res.status(500).json({ error: err?.message || "Failed to send submission." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
