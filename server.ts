import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import { addDays, formatTimeSlot, generateId } from "./src/lib/utils";

// Start minimal server logic
const app = express();
app.use(express.json());
const PORT = 3000;

// Internal API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Since we are running in full local demo logic initially on the client, 
// we will expose Gemini through this wrapper for advanced tasks (when API key is present)
app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, systemInstruction } = req.body;
    
    // Fallback if no key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: "No GEMINI_API_KEY available" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash"; // Required by instructions
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
      }
    });

    if (response.text) {
      res.json({ response: response.text });
    } else {
        res.status(500).json({ error: "Empty response from Gemini" });
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Prod static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Setup WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs) => {
    console.log("Client connected to /live");
    if (!process.env.GEMINI_API_KEY) {
      clientWs.close(1008, "No GEMINI_API_KEY available");
      return;
    }
    
    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{
              text: `Du bist der digitale Telefonempfang des Friseursalons Scissors in Hannover. Du sprichst ausschließlich Deutsch, freundlich, professionell und kurz. Deine Hauptaufgaben sind Termine vereinbaren, verschieben oder absagen.`
            }]
          },
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          }
        },
      });

      // Add simple fallback text handling via transcription
      // (Gemini Live API does not currently support inputAudioTranscription in all forms, 
      // but we can listen for text parts if they are emitted).

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: msg.audio
              }
            });
          }
          if (msg.text) {
             session.sendRealtimeInput({ text: msg.text });
          }
        } catch (e) {
          console.error("Error processing ws message", e);
        }
      });
      
      clientWs.on("close", () => {
        console.log("Client disconnected");
      });
      
    } catch(err) {
      console.error("Gemini Live API connection failed", err);
      clientWs.close(1011, "Internal Error");
    }
  });
}

startServer();
