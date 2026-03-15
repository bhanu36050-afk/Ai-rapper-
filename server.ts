import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";

const db = new Database("gullyai.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    credits INTEGER DEFAULT 3,
    is_premium INTEGER DEFAULT 0
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) {
      db.prepare("INSERT INTO users (id, credits, is_premium) VALUES (?, ?, ?)").run(req.params.id, 3, 0);
      return res.json({ id: req.params.id, credits: 3, is_premium: 0 });
    }
    res.json(user);
  });

  app.post("/api/user/:id/add-credits", (req, res) => {
    const { amount } = req.body;
    db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/user/:id/upgrade", (req, res) => {
    db.prepare("UPDATE users SET is_premium = 1, credits = 999999 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // AI Lyrics Proxy (Using Gemini for built-in support)
  app.post("/api/generate-lyrics", async (req, res) => {
    const { prompt, mode, userId } = req.body;
    
    // Check credits
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user || (user.credits <= 0 && user.is_premium === 0)) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let systemInstruction = "You are a savage Desi Rapper. Write rhythmic, rhyming rap lyrics with heavy metaphors in Hinglish (Hindi + English). Use street slang like 'Bantai', 'Machayenge', 'Asli'. Structure it with [Verse 1], [Chorus], [Verse 2], [Outro].";
      
      if (mode === 'burn') systemInstruction += " This is a BURN mode. Roast the subject brutally but rhythmically.";
      if (mode === 'gully') systemInstruction += " This is GULLY mode. Tell a deep story of struggle and survival.";
      if (mode === 'flex') systemInstruction += " This is FLEX mode. Motivational, hustle-focused, gym/success vibes.";

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction }
      });

      // Deduct credit if not premium
      if (user.is_premium === 0) {
        db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").run(userId);
      }

      res.json({ lyrics: result.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate lyrics" });
    }
  });

  // ElevenLabs Proxy (Placeholder for actual API integration)
  app.post("/api/generate-voice", async (req, res) => {
    const { text, voiceId } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "ElevenLabs API Key not configured" });
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) throw new Error("ElevenLabs API failed");

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.set("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Voice generation failed" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
