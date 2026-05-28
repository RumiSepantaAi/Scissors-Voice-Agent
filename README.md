# Scissors Friseursalon - Voice Agent Demo

Diese Demo-Web-App veranschaulicht einen Voice AI Agent für den Friseursalon "Scissors" in Hannover. Der Agent nimmt Anrufe entgegen, vereinbart Termine, verschiebt sie und sagt sie ab.

## Architektur & Features
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express + Vite Middleware (`server.ts`)
- **Modell**: Google Gemini (`gemini-3.5-flash` per Default, konfigurierbar)
- **Persistenz**: LocalStorage (inklusive Demo-Modus Fallback ohne API Key)
- **Funktionalitäten**: Terminmanagement, Kalenderansicht, Voice-Frontend (Web Speech API / Text Fallback).

## Lokales Setup (Google AI Studio / Node)

1. Abhängigkeiten installieren (bereits in der UI passiert):
   ```bash
   npm install
   ```

2. `.env` Datei anlegen (kopiere von `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Trage deinen `GEMINI_API_KEY` ein, um die echte KI zu aktivieren. Wenn leer, startet die App im reinen lokalen **Demo-Modus** mit simulierten Fallbacks.

3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

## Produktiv-Deployment

Das Projekt ist kompatibel für **Render** oder klassische Container-Umgebungen (inklusive Cloud Run), da wir Vite mit einem Express-Server gekoppelt haben.

**Build & Start:**
```bash
npm run build
npm run start
```
*Hinweis für Vercel:* Für ein originales Vercel-Deployment müsste das Projekt auf Next.js umgebaut oder der Express-Server in Vercel Serverless Functions ausgelagert werden. In dieser Struktur läuft es ideal in Docker, Render oder Google Cloud Run.

## Simulierte Funktionen für Demo
- **Telefonie**: Es wird ein Interface zur Simulation von Anrufen bereitgestellt (entweder via Mikrofon oder Texteingabe). Echte SIP/Telefoniestacks wie Twilio oder Voximplant können an den Backend-Endpunkt angebunden werden.
- **Kalenderintegration**: Termine werden lokal gespeichert. Die App ist darauf vorbereitet, dass Serverseitig (mittels den Function Calls in `server.ts`) in Zukunft echte Google Calendar / Outlook APIs angesprochen werden.

## Datenschutz (Deutschland)
Dies ist eine reine Demo-Anwendung. In einem Produktivbetrieb in Deutschland muss für KI-Telefonie, Sprachaufzeichnung und Terminverarbeitung eine explizite, DSGVO-konforme Einwilligung eingeholt werden.
