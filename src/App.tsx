import React, { useState, useEffect } from 'react';
import { useSalonStore } from './store';
import { LayoutDashboard, Mic, Calendar as CalendarIcon, List as ListIcon, Settings as SettingsIcon, Code } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import VoiceAgentTab from './components/VoiceAgentTab';
import CalendarTab from './components/CalendarTab';
import AppointmentsTab from './components/AppointmentsTab';
import SettingsTab from './components/SettingsTab';
import DebugTab from './components/DebugTab';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const store = useSalonStore();

  useEffect(() => {
    document.title = store.config.name || 'Scissors';
  }, [store.config.name]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab store={store} />;
      case 'voice': return <VoiceAgentTab store={store} />;
      case 'calendar': return <CalendarTab store={store} />;
      case 'appointments': return <AppointmentsTab store={store} />;
      case 'settings': return <SettingsTab store={store} />;
      case 'debug': return <DebugTab store={store} />;
      default: return <DashboardTab store={store} />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'voice', label: 'Voice Agent', icon: Mic },
    { id: 'calendar', label: 'Kalender', icon: CalendarIcon },
    { id: 'appointments', label: 'Termine', icon: ListIcon },
    { id: 'settings', label: 'Einstellungen', icon: SettingsIcon },
    { id: 'debug', label: 'Debug JSON', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg font-bold text-lg font-mono">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">{store.config.name}</h1>
            <p className="text-xs text-gray-400 font-medium">Voice AI Demo</p>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? "opacity-100" : "opacity-70"} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        
        {store.config.demoMode ? (
            <div className="p-4 m-4 bg-orange-50 border border-orange-100 rounded-xl">
               <div className="flex items-center space-x-2 text-orange-800 mb-1">
                 <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                 <span className="text-xs font-semibold uppercase tracking-wider">Demo-Modus</span>
               </div>
               <p className="text-[10px] text-orange-600/80 leading-tight">API Key fehlt. Agent läuft lokal simuliert.</p>
            </div>
        ) : (
            <div className="p-4 m-4 bg-emerald-50 border border-emerald-100 rounded-xl">
               <div className="flex items-center space-x-2 text-emerald-800 mb-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-xs font-semibold uppercase tracking-wider">KI-Modus</span>
               </div>
               <p className="text-[10px] text-emerald-600/80 leading-tight">Mit Gemini Backend verbunden.</p>
            </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
           {renderTab()}
        </div>
      </main>
    </div>
  );
}

export default App;
