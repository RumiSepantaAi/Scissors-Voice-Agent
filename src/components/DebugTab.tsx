import React from 'react';
import { useSalonStore } from '../store';
import { Trash2 } from 'lucide-react';

export default function DebugTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const handleReset = () => {
    if(confirm("Alle lokalen Demo-Daten zurücksetzen?")) {
        store.resetDemoData();
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(JSON.stringify(store.appointments, null, 2));
      alert("Kopiert!");
  }

  return (
    <div className="space-y-6 max-w-5xl">
       <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Debug JSON</h2>
           <p className="text-gray-500">Live-Einblick in den localStorage und State der Anwendung.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-lg font-medium text-sm flex items-center gap-2">
                <Trash2 size={16} /> Zurücksetzen
            </button>
            <button onClick={handleCopy} className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors rounded-lg font-medium text-sm">
                JSON Kopieren
            </button>
        </div>
       </div>

       <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
           <div className="bg-gray-800 p-3 border-b border-gray-700 flex text-xs text-gray-400 font-mono">
               <span>appointments.json</span>
           </div>
           <pre className="p-4 text-emerald-400 font-mono text-xs overflow-x-auto h-[600px] overflow-y-auto">
               {JSON.stringify(store.appointments, null, 2)}
           </pre>
       </div>
    </div>
  );
}
