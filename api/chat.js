export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  const userMessage = (req.body && req.body.message) || "";
  if (!userMessage.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    return res.status(200).json({ message: aiMessage });
  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
