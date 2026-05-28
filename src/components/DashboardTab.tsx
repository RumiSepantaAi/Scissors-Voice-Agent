import React from 'react';
import { useSalonStore } from '../store';
import { Calendar, PhoneCall, Bot, Info, AlertTriangle } from 'lucide-react';

export default function DashboardTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const { config, appointments } = store;
  
  const activeAppointments = appointments.filter(a => a.status === 'geplant').length;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Übersicht</h2>
        <p className="text-gray-500 max-w-2xl">
          Diese Demo zeigt, wie ein KI-Telefonagent Termine für einen Friseursalon annimmt, verschiebt und absagt. 
          Willkommen im Control Center von {config.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Cards */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Voice Agent</p>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Aktiv
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Bot size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-tight">Bereit für eingehende Anrufe im Browser.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Kalender</p>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Verbunden
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-tight">Lokaler Demo-Kalender mit {activeAppointments} aktiven Terminen.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Telefonie</p>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Simuliert
              </h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PhoneCall size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-tight">Gespräche werden lokal simuliert (Web Speech/Text).</p>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${config.demoMode ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-gray-100'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Gemini API</p>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.demoMode ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                {config.demoMode ? 'Deaktiviert' : 'Aktiv'}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${config.demoMode ? 'bg-orange-100/50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Info size={20} />
            </div>
          </div>
          <p className={`text-xs ${config.demoMode ? 'text-orange-600/80' : 'text-gray-400'} mt-4 leading-tight`}>
            {config.demoMode ? 'Kein API Key. Nutze regelbasierte Fallbacks.' : `Modell: ${config.geminiModel}`}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mt-1">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Datenschutz- & Compliance-Hinweis</h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              In Deutschland erfordert die automatische Aufzeichnung und Transkription von Telefonaten sowie die 
              Verarbeitung von Kundendaten durch KI-Systeme klare rechtliche Rahmenbedingungen (DSGVO). 
              Diese Anwendung ist eine rein technische Demo-Implementierung. 
            </p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
               <span className="font-semibold text-sm text-gray-800">Produktiveinsatz erfordert:</span>
               <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                 <li>Explizite Einwilligung der Anrufer (Opt-in) vor der Gesprächsaufzeichnung</li>
                 <li>Echte SIP/Telefoniestacks (z.B. Twilio) anstelle der Browsersimulation</li>
                 <li>Sichere Anbindung von echten Kalender-APIs (OAuth2)</li>
                 <li>DSGVO-konforme Data Processing Agreements (AVV) mit LLM-Anbietern</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
