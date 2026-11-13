// This file runs on Vercel's server, not in the browser.
// Groq hosts open-source models; this is its chat address
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Llama 3.1 8B: the same open-source family as llama3.2 on your laptop
const GROQ_MODEL = "llama-3.1-8b-instant";

// Vercel calls fetch() each time someone visits /api/chat
export default {
  async fetch(request) {
    // this address only takes POST requests
    if (request.method !== "POST") {
      // 405 means "wrong method"
      return new Response("Use POST", { status: 405 });
    }
    // read the body React sent: the messages, tools, and stream setting
    const body = await request.json();
    // swap the laptop model name for Groq's model name
    body.model = GROQ_MODEL;
    // the secret key: set on Vercel, never sent to the browser
    const key = process.env.GROQ_API_KEY;
    // Groq expects "Bearer" and then the key
    const authHeader = "Bearer " + key;
    // turn the body back into JSON text
    const bodyText = JSON.stringify(body);
    // the request to Groq, with the key added
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: bodyText,
    };
    // send it to Groq; wait for the response to start
    const groqResponse = await fetch(GROQ_URL, options);
    // keep Groq's content type (JSON, or a stream)
    const contentType = groqResponse.headers.get("Content-Type");
    // pass Groq's body straight back to React, stream and all
    const answer = new Response(groqResponse.body, {
      status: groqResponse.status,
      headers: { "Content-Type": contentType },
    });
    // send it to the browser
    return answer;
  },
};
