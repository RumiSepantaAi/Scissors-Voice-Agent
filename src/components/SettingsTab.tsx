import React from 'react';
import { useSalonStore } from '../store';
import { SERVICES, STAFF, BUSINESS_HOURS } from '../constants';

export default function SettingsTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const { config, setConfig } = store;

  const handleChange = (key: keyof typeof config, value: string | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Einstellungen</h2>
        <p className="text-gray-500">Konfiguration für die Salon-Demo.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Salon Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name des Salons</label>
            <input 
              type="text" 
              className="w-full md:w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              value={config.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
            <input 
              type="text" 
              className="w-full md:w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              value={config.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Technik & KI Setup</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
             <div>
                <p className="font-semibold text-gray-900">Force Local Demo Mode</p>
                <p className="text-sm text-gray-500">Ignoriere API-Keys und simuliere Anrufe komplett lokal (Regelbasiert).</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.demoMode} onChange={(e) => handleChange('demoMode', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
             </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Standard Gemini Modell</label>
               <input 
                 type="text" 
                 className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm opacity-70"
                 value={config.geminiModel}
                 onChange={(e) => handleChange('geminiModel', e.target.value)}
                 disabled
               />
               <p className="text-xs text-gray-400 mt-1">Konfigurierbar via ENV: GEMINI_MODEL</p>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Live API Modell (Vorbreitet)</label>
               <input 
                 type="text" 
                 className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm opacity-70"
                 value={config.liveModel}
                 onChange={(e) => handleChange('liveModel', e.target.value)}
                 disabled
               />
               <p className="text-xs text-gray-400 mt-1">Konfigurierbar via ENV: GEMINI_LIVE_MODEL</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mitarbeiter</h3>
          <ul className="space-y-2">
            {STAFF.map(s => (
              <li key={s} className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 font-medium">❖ {s}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leistungen</h3>
          <ul className="space-y-3">
            {SERVICES.map(s => (
              <li key={s.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg text-sm">
                 <div>
                    <span className="font-medium text-gray-900 block">{s.name}</span>
                    <span className="text-xs text-gray-500">{s.durationMinutes} Min</span>
                 </div>
                 <span className="text-gray-500">{s.priceText}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
    </div>
  );
}
