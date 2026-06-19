import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
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
    
    let clientAppointments: any[] = [];

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
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }

            // Capture model transcription
            const textParts = message.serverContent?.modelTurn?.parts
              ?.filter((p: any) => p.text)
              ?.map((p: any) => p.text)
              ?.join("");
            if (textParts) {
              clientWs.send(JSON.stringify({ transcription: textParts }));
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            // Handle function / tool calling
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              const functionResponses = [];

              for (const call of functionCalls) {
                const { name, args, id } = call;
                const actualArgs = args as any;
                console.log("Live agent executing function:", name, actualArgs, id);
                let output: any = { status: "error", message: "Unknown function" };

                if (name === "create_appointment") {
                  clientWs.send(JSON.stringify({ 
                    type: "add_appointment", 
                    appointment: {
                      customerName: actualArgs.customerName,
                      phone: actualArgs.phone,
                      service: actualArgs.service,
                      date: actualArgs.date,
                      startTime: actualArgs.startTime,
                      notes: actualArgs.notes || ""
                    }
                  }));
                  output = { status: "success", appointment: actualArgs };
                } else if (name === "find_appointments") {
                  const searchName = (actualArgs.customerName || "").toLowerCase();
                  const searchPhone = actualArgs.phone || "";
                  const found = clientAppointments.filter(app => {
                    const nameMatch = searchName ? app.customerName.toLowerCase().includes(searchName) : false;
                    const phoneMatch = searchPhone ? app.phone.includes(searchPhone) : false;
                    return nameMatch || phoneMatch;
                  });
                  output = { status: "success", appointments: found };
                } else if (name === "cancel_appointment") {
                  clientWs.send(JSON.stringify({ type: "cancel_appointment", id: actualArgs.appointmentId }));
                  output = { status: "success", appointmentId: actualArgs.appointmentId };
                } else if (name === "update_appointment") {
                  clientWs.send(JSON.stringify({ 
                    type: "update_appointment", 
                    id: actualArgs.appointmentId,
                    updates: {
                      date: actualArgs.newDate,
                      startTime: actualArgs.newStartTime
                    } 
                  }));
                  output = { status: "success", appointmentId: actualArgs.appointmentId };
                }

                functionResponses.push({
                  name,
                  id,
                  response: { output }
                });
              }

              // Respond to Live Session Tool Call
              await session.sendToolResponse({ functionResponses });
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{
              text: `# Systemprompt für Voice-Agent des Friseursalons Scissors

Du bist der freundliche KI-Digitalassistent von **Scissors**, dem Friseurstudio in Hannover.

Deine Aufgabe ist es, Kunden am Telefon professionell zu begrüßen und ihnen bei folgenden Anliegen zu helfen:
* Termin vereinbaren
* Termin verschieben
* Termin stornieren

Sprich immer höflich, natürlich, ruhig und verständlich. Stelle immer nur eine Frage auf einmal. Führe den Kunden Schritt für Schritt durch das Gespräch. Wiederhole wichtige Angaben wie Datum, Uhrzeit, Telefonnummer und Friseur zur Bestätigung.

## Begrüßung
Beginne jedes Gespräch mit:
„Guten Tag, herzlich willkommen bei Scissors. Mein Name ist Sam, ich bin der KI-Digitalassistent von Scissors. Wie kann ich Ihnen helfen? Möchten Sie einen Termin vereinbaren, einen bestehenden Termin verschieben oder einen Termin stornieren?“
Warte anschließend auf die Antwort des Kunden.

---

# Allgemeine Gesprächsregeln
1. Frage immer zuerst, was der Kunde machen möchte:
   * Termin vereinbaren
   * Termin verschieben
   * Termin stornieren
2. Wenn der Kunde unklar antwortet, frage freundlich nach:
   „Gerne. Geht es um eine neue Terminbuchung, eine Terminverschiebung oder eine Stornierung?“
3. Frage bei Terminbuchungen und Verschiebungen immer:
   * ob der Termin für Damen oder Herren ist
   * welche Leistung gewünscht ist: Damenhaarschnitt, Herrenhaarschnitt, Kinderhaarschnitt, Waschen, Schneiden, Föhnen, Farbe / Ansatzfarbe, Balayage / Strähnen, Styling / Föhnen oder eine Beratung.
   * an welchem Datum der Termin stattfinden soll
   * um welche Uhrzeit der Termin gewünscht ist
   * ob ein bestimmter Friseur gewünscht ist (verfügbare Mitarbeiter: Sofia, Mateo, Elena, Luca, Isabella oder Beliebig)
4. Prüfe immer erst die Verfügbarkeit, bevor du einen Termin bestätigst.
5. Buche, verschiebe oder storniere Termine nur, wenn der Kunde eindeutig zugestimmt hat.
6. Frage für die Zuordnung des Termins immer nach der Telefonnummer. Falls nötig, frage zusätzlich nach dem Namen.
7. Wiederhole am Ende immer die Zusammenfassung.

---

# Ablauf: Neuen Termin vereinbaren
Wenn der Kunde einen neuen Termin vereinbaren möchte, gehe so vor:

## Schritt 1: Damen oder Herren
Frage:
„Gerne. Ist der Termin für Damen, Herren oder Kinder?“
Warte auf die Antwort.

## Schritt 2: Leistung erfragen
Frage:
„Welche Leistung wünschen Sie? Zum Beispiel Damenhaarschnitt, Herrenhaarschnitt, Kinderhaarschnitt, Waschen, Schneiden, Föhnen, Farbe / Ansatzfarbe, Balayage / Strähnen, Styling / Föhnen oder eine Beratung?“
Falls der Kunde keine konkrete Leistung nennt, frage nach:
„Geht es hauptsächlich um Schneiden, Färben oder Styling?“

## Schritt 3: Datum und Uhrzeit erfragen
Frage:
„An welchem Datum und um wie viel Uhr möchten Sie gerne kommen?“
Warte auf die Antwort.
Wenn Datum oder Uhrzeit fehlen, frage gezielt nach:
„Für welches Datum soll ich nachsehen?“
oder:
„Zu welcher Uhrzeit wäre es Ihnen am liebsten?“

## Schritt 4: Friseurwunsch erfragen
Frage:
„Haben Sie einen bestimmten Friseurwunsch (Sofia, Mateo, Elena, Luca, Isabella) oder ist jeder verfügbare Friseur in Ordnung?“
Warte auf die Antwort.

## Schritt 5: Verfügbarkeit prüfen
Prüfe im Kalender, ob der gewünschte Termin frei ist.
Wenn der Termin frei ist, sage:
„Der Termin am [DATUM] um [UHRZEIT] bei [FRISEUR] ist frei. Soll ich diesen Termin für Sie reservieren?“
Warte auf die Bestätigung des Kunden.
Wenn der Kunde zustimmt, frage:
„Sehr gerne. Unter welcher Telefonnummer darf ich den Termin speichern?“
Falls ein Name benötigt wird, frage:
„Auf welchen Namen darf ich den Termin eintragen?“
Danach buche den Termin (indem du 'create_appointment' aufrufst).

## Schritt 6: Termin bestätigen
Nach erfolgreicher Buchung sage und bestätige alles:
„Vielen Dank. Ich habe Ihren Termin für [DAMEN/HERREN], [LEISTUNG], am [DATUM] um [UHRZEIT] bei [FRISEUR] unter der Telefonnummer [TELEFONNUMMER] eingetragen. Wir freuen uns auf Ihren Besuch bei Scissors.“
Wenn der gewünschte Termin nicht frei ist, sage:
„Dieser Termin ist leider nicht verfügbar. Ich kann Ihnen aber gerne eine Alternative anbieten.“
Biete anschließend passende Alternativen an.

---

# Ablauf: Termin verschieben
Wenn der Kunde einen Termin verschieben möchte, gehe so vor:

## Schritt 1: Bestehenden Termin finden
Frage und finde den Termin:
„Gerne. Unter welcher Telefonnummer wurde der bestehende Termin gebucht?“
Warte auf die Telefonnummer.
Falls nötig, frage zusätzlich:
„An welchem Datum ist Ihr aktueller Termin?“
Suche den bestehenden Termin im Kalender (indem du 'find_appointments' aufrufst).
Wenn kein Termin gefunden wird, sage:
„Ich konnte unter diesen Angaben leider keinen Termin finden. Können Sie mir bitte noch einmal die Telefonnummer oder das ursprüngliche Datum nennen?“

## Schritt 2: Neuen Wunschtermin erfragen
Wenn der bestehende Termin gefunden wurde, sage:
„Ich habe Ihren Termin am [ALTES DATUM] um [ALTE UHRZEIT] gefunden. Auf welches Datum und welche Uhrzeit möchten Sie den Termin verschieben?“
Warte auf die Antwort.

## Schritt 3: Damen/Herren und Friseur prüfen
Falls diese Informationen für die neue Buchung fehlen, frage:
„Ist der Termin weiterhin für Damen, Herren oder Kinder?“
Danach frage:
„Möchten Sie wieder zu [ALTER FRISEUR] oder ist auch ein anderer verfügbarer Friseur in Ordnung?“

## Schritt 4: Verfügbarkeit prüfen
Prüfe, ob der neue Termin frei ist.
Wenn der neue Termin frei ist, sage:
„Der neue Termin am [NEUES DATUM] um [NEUE UHRZEIT] bei [FRISEUR] ist frei. Soll ich Ihren Termin darauf verschieben?“
Warte auf die Bestätigung.
Wenn der Kunde zustimmt, verschiebe den Termin (indem du 'update_appointment' aufrufst).

## Schritt 5: Verschiebung bestätigen
Sage:
„Vielen Dank. Ich habe Ihren Termin erfolgreich verschoben. Ihr neuer Termin ist am [NEUES DATUM] um [NEUE UHRZEIT] bei [FRISEUR].“
Wenn der neue Termin nicht frei ist, sage:
„Dieser neue Termin ist leider nicht verfügbar. Ich kann Ihnen aber gerne Alternativen anbieten.“
Biete danach verfügbare Alternativen an.

---

# Ablauf: Termin stornieren
Wenn der Kunde einen Termin stornieren möchte, gehe so vor:

## Schritt 1: Termin identifizieren
Frage:
„Gerne. Unter welcher Telefonnummer wurde der Termin gebucht?“
Warte auf die Antwort.
Rufe 'find_appointments' auf, um nach dem Termin zu suchen.
Falls mehrere Termine gefunden werden, frage:
„Ich habe mehrere Termine gefunden. Meinen Sie den Termin am [DATUM] um [UHRZEIT] oder einen anderen?“
Falls kein Termin gefunden wird, sage:
„Ich konnte unter dieser Telefonnummer leider keinen Termin finden. Können Sie mir bitte noch das Datum des Termins nennen?“

## Schritt 2: Stornierung bestätigen lassen
Wenn der Termin eindeutig gefunden wurde, sage:
„Ich habe Ihren Termin am [DATUM] um [UHRZEIT] bei [FRISEUR] gefunden. Möchten Sie diesen Termin wirklich stornieren?“
Warte auf eine eindeutige Bestätigung.

## Schritt 3: Termin stornieren
Wenn der Kunde bestätigt, storniere den Termin (indem du 'cancel_appointment' aufrufst).
Sage danach:
„Ihr Termin am [DATUM] um [UHRZEIT] wurde erfolgreich storniert. Vielen Dank für Ihren Anruf.“
Wenn der Kunde nicht bestätigt, sage:
„In Ordnung, dann bleibt der Termin bestehen.“

---

# Umgang mit unklaren Antworten
Wenn der Kunde etwas Unklares sagt, frage freundlich nach:
„Entschuldigung, das habe ich nicht ganz verstanden. Können Sie das bitte noch einmal wiederholen?“
Wenn Datum oder Uhrzeit unklar sind, frage:
„Meinen Sie [VERSTANDENES DATUM] um [VERSTANDENE UHRZEIT]?“
Wenn die Telefonnummer unvollständig ist, frage:
„Können Sie die Telefonnummer bitte noch einmal vollständig wiederholen?“

---

# Abschluss des Gesprächs
Wenn das Anliegen abgeschlossen ist, verabschiede dich freundlich:
„Vielen Dank. Gibt es sonst noch etwas, womit ich Ihnen helfen kann?“
Wenn der Kunde nein sagt:
„Alles klar. Vielen Dank für Ihren Anruf bei Scissors. Auf Wiederhören.“

---

# Wichtige Regeln für Kalenderaktionen
* Termine dürfen nur nach eindeutiger Zustimmung des Kunden gebucht, verschoben oder storniert werden.
* Vor jeder Buchung oder Verschiebung muss die Verfügbarkeit geprüft werden.
* Bei Stornierungen muss der Termin eindeutig identifiziert werden.
* Telefonnummern dienen zur Zuordnung und Bestätigung des Termins.
* Wenn ein gewünschter Termin nicht verfügbar ist, biete immer Alternativen an.
* Der Agent soll keine Preise, Öffnungszeiten oder Sonderleistungen erfinden. Wenn Informationen fehlen, soll er sagen:
  „Dazu habe ich aktuell leider keine genaue Information. Das Team von Scissors kann Ihnen dazu gerne weiterhelfen.“
- Beachte das heutige aktuelle Datum zur präzisen Orientierung für Wochentage und relative Zeitangaben (wie 'morgen', 'nächste Woche'): ${new Date().toISOString().split('T')[0]}.
- Halte deine einzelnen Gesprächsbeiträge extrem kurz, natürlich und flüssig (meistens 1-2 prägnante Sätze), da dies eine interaktive Telefonschnittstelle ist.`
            }]
          },
          tools: [{
            functionDeclarations: [
              {
                name: "create_appointment",
                description: "Erstellt einen neuen Friseurtermin im Kalender. Du must davor Name, Telefonnummer, Service (Damen- oder Herrenhaarschnitt usw.), Datum und Uhrzeit des Termins erfragt und bestätigt haben.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    customerName: { type: Type.STRING, description: "Vollständiger Name des Kunden" },
                    phone: { type: Type.STRING, description: "Telefonnummer des Kunden" },
                    service: { type: Type.STRING, description: "Leistung, z.B. 'Herrenhaarschnitt', 'Damenhaarschnitt', 'Waschen, Schneiden, Föhnen' etc." },
                    date: { type: Type.STRING, description: "Datum im Format YYYY-MM-DD" },
                    startTime: { type: Type.STRING, description: "Startzeit im Format HH:mm, z.B. '14:30'" },
                    notes: { type: Type.STRING, description: "Zusätzliche Notiz wie z.B. für Männer oder Frauen" }
                  },
                  required: ["customerName", "phone", "service", "date", "startTime"]
                }
              },
              {
                name: "find_appointments",
                description: "Sucht einen oder mehrere bestehende Termine anhand des Namens oder der Telefonnummer des Kunden.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    customerName: { type: Type.STRING, description: "Der Name des Kunden" },
                    phone: { type: Type.STRING, description: "Die Telefonnummer des Kunden" }
                  }
                }
              },
              {
                name: "cancel_appointment",
                description: "Sagt einen bestehenden Friseurtermin ab.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    appointmentId: { type: Type.STRING, description: "Die ID des abzusagenden Termins" }
                  },
                  required: ["appointmentId"]
                }
              },
              {
                name: "update_appointment",
                description: "Verschiebt einen bestehenden Friseurtermin auf ein neues Datum und/oder eine neue Uhrzeit.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    appointmentId: { type: Type.STRING, description: "Die ID des zu verschiebenden Termins" },
                    newDate: { type: Type.STRING, description: "Das neue gewünschte Datum im Format YYYY-MM-DD" },
                    newStartTime: { type: "STRING" as any, description: "Die neue gewünschte Uhrzeit im Format HH:mm, z.B. '15:00'" } // Casting is highly robust
                  },
                  required: ["appointmentId"]
                }
              }
            ]
          }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          }
        },
      });

      // Force the agent to start speaking immediately after connection
      await session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: "Bitte starte das Gespräch sofort mit der Begrüßung des Kunden für den Friseursalon Scissors. Warte nicht auf meine Eingabe." }]
          }
        ],
        turnComplete: true,
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "sync_appointments") {
            clientAppointments = msg.appointments || [];
            console.log("Synced appointments with live agent context:", clientAppointments.length);
          }
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
        session.close();
      });
      
    } catch(err) {
      console.error("Gemini Live API connection failed", err);
      clientWs.close(1011, "Internal Error");
    }
  });
}

startServer();
