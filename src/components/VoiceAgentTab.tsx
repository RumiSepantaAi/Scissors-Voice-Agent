import React, { useState, useEffect, useRef } from 'react';
import { useSalonStore } from '../store';
import { Bot, User, Mic, Square, ExternalLink, Activity, PhoneCall } from 'lucide-react';
import { handleDemoAgentTurn } from '../lib/demoAgentLogic';
import { pcmToBase64, base64ToPcm } from '../lib/audioUtils';

export default function VoiceAgentTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const { config, appointments } = store;
  
  const [messages, setMessages] = useState<{role: 'agent'|'user', text: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  
  useEffect(() => {
     endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    return () => {
       endCall(); // Cleanup on unmount
    }
  }, []);

  const playAudioChunk = (ctx: AudioContext, base64: string) => {
    const f32 = base64ToPcm(base64);
    const buffer = ctx.createBuffer(1, f32.length, 24000); // Live output is 24kHz
    buffer.copyToChannel(f32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  const startLiveMode = async () => {
    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/live`);
      wsRef.current = ws;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (err: any) {
        console.warn("Microphone access denied or blocked in iframe. Please use new tab.", err);
        setMessages(p => [...p, { role: 'agent', text: `[Fehler] Mikrofon konnte nicht aktiviert werden. Das passiert oft innerhalb des iFrames. Bitte klicken Sie oben in der Leiste auf den "Open in New Tab" (Neuen Tab öffnen) Pfeil, um die App im vollen Fenster zu öffnen.` }]);
        if (wsRef.current) wsRef.current.close();
        setIsCalling(false);
        setIsLiveActive(false);
        return;
      }
      
      if (stream) {
        const source = audioCtx.createMediaStreamSource(stream);
        // Deprecated but required for simple raw PCM extraction in browser
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        
        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          const f32Array = e.inputBuffer.getChannelData(0);
          const base64 = pcmToBase64(f32Array);
          ws.send(JSON.stringify({ audio: base64 }));
        };
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
             playAudioChunk(audioCtx, msg.audio);
          }
          if (msg.interrupted) {
             nextStartTimeRef.current = 0;
          }
        } catch (e) {
          console.error("Live JS error", e);
        }
      };

      ws.onopen = () => {
        setMessages([{ role: 'agent', text: 'Live Voice verbunden. Sprechen Sie jetzt!' }]);
      };
      
      ws.onclose = () => {
        setIsLiveActive(false);
      }

      setIsCalling(true);
      setIsLiveActive(true);
    } catch (e) {
      console.error(e);
      setMessages(p => [...p, { role: 'agent', text: `[Fehler] Mikrofon/Websocket konnte nicht gestartet werden: ${e}` }]);
    }
  };

  const startCall = () => {
      if (!config.demoMode) {
          startLiveMode();
      } else {
          setIsCalling(true);
          setMessages([{ role: 'agent', text: `Guten Tag, hier ist der digitale Empfang von ${config.name} in ${config.location}. Wie kann ich Ihnen helfen?` }]);
      }
  };

  const endCall = () => {
      setIsCalling(false);
      setIsLiveActive(false);
      setMessages(prev => [...prev, { role: 'agent', text: 'Gespräch beendet.' }]);
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
  };

  const handleSend = async () => {
      if(!inputText.trim() || !isCalling || isProcessing) return;

      const userText = inputText;
      setInputText("");
      setMessages(p => [...p, { role: 'user', text: userText }]);
      setIsProcessing(true);

      if (config.demoMode) {
          await new Promise(r => setTimeout(r, 600));
          const response = handleDemoAgentTurn(userText, store);
          setMessages(p => [...p, { role: 'agent', text: response }]);
      } else {
          try {
          if (isLiveActive && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ text: userText }));
              setMessages(p => [...p, { role: 'agent', text: `[Live Text gesendet]` }]);
          } else {
             // Fallback text api
             const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                   message: userText, 
                   history: [],
                   systemInstruction: `Du bist der digitale Telefonempfang des Friseursalons Scissors in Hannover. Du sprichst ausschließlich Deutsch, freundlich, professionell und kurz. Deine Hauptaufgaben sind: Friseurtermine vereinbaren, bestehende Termine finden, Termine absagen, Termine verschieben.`
                })
             });
             const data = await res.json();
             if(data.error) {
                setMessages(p => [...p, { role: 'agent', text: `[Fehler]: ${data.error}` }]);
             } else {
                setMessages(p => [...p, { role: 'agent', text: data.response }]);
             }
          }
          } catch(e) {
             setMessages(p => [...p, { role: 'agent', text: `[Fehler]: Konnte keine Verbindung aufbauen.` }]);
          }
      }
      setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl max-h-[85vh] flex flex-col border border-gray-200 rounded-3xl bg-white shadow-xl overflow-hidden mx-auto h-full">
      {/* Call Header */}
      <div className="bg-gray-900 p-6 flex items-center justify-between flex-shrink-0">
          <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 {isCalling && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>}
                 Voice Agent Intercom
              </h2>
              <p className="text-gray-400 text-sm mt-1">{isCalling ? 'Verbunden • Demo Kanal' : 'Bereit für Anruf'}</p>
          </div>
          <div className="flex gap-3">
              {!isCalling ? (
                  <button onClick={startCall} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg flex items-center gap-2">
                      <PhoneCall size={16} /> Anruf starten
                  </button>
              ) : (
                  <button onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg flex items-center gap-2">
                       <Square size={16} fill="currentColor" /> Auflegen
                  </button>
              )}
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
          {messages.length === 0 && (
              <div className="m-auto text-center w-full max-w-lg p-8">
                  <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-8">Klicken Sie auf "Anruf starten", um eine Simulation zu beginnen.</p>
                  
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Szenario laden</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                     <button onClick={() => setInputText("Hallo, ich möchte gerne einen Termin für einen Damenhaarschnitt machen. Am liebsten Freitagvormittag.")} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-xs text-gray-700 font-medium">💇‍♀️ Neuer Termin</button>
                     <button onClick={() => setInputText("Ich bin Maria Keller und möchte meinen Termin absagen.")} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-xs text-gray-700 font-medium">❌ Termin absagen</button>
                     <button onClick={() => setInputText("Was kostet Balayage bei euch?")} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-xs text-gray-700 font-medium">💰 Preisfrage</button>
                     <button onClick={() => setInputText("Habt ihr montags geöffnet?")} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-xs text-gray-700 font-medium">🕒 Öffnungszeiten</button>
                  </div>
              </div>
          )}
          {messages.map((m, i) => (
             <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                     m.role === 'user' 
                     ? 'bg-black text-white rounded-tr-sm' 
                     : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                 }`}>
                     {m.text}
                 </div>
             </div>
          ))}
          {isProcessing && (
              <div className="flex w-full justify-start">
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-sm text-gray-500 shadow-sm flex items-center gap-2">
                     <div className="flex gap-1">
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                  </div>
              </div>
          )}
          <div ref={endRef} />
      </div>

      {/* Input Area (Fallback for Voice) */}
      <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex grid grid-cols-[1fr_auto_auto] gap-2 items-end max-w-2xl mx-auto">
              <div className="relative">
                  <textarea 
                    rows={2}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Simuliertes Transkript eingeben..."
                    disabled={!isCalling || isProcessing}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-black focus:bg-white resize-none text-sm transition-all disabled:opacity-50"
                  />
              </div>
              <button 
                 disabled
                 title="Live Voice (In Entwicklung)"
                 className="p-3 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed">
                  <Mic size={20} />
              </button>
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || !isCalling || isProcessing}
                className="px-6 py-3 bg-black text-white font-medium text-sm rounded-xl hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors h-full">
                  Senden
              </button>
          </div>
          <div className="text-center mt-3">
             <p className="text-[10px] text-gray-400 font-medium tracking-wide">WEB SPEECH API ODER TEXT-FALLBACK MODUS</p>
          </div>
      </div>
    </div>
  );
}

