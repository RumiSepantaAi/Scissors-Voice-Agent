import React, { useState } from 'react';
import { useSalonStore } from '../store';
import { format, parseISO, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AppointmentsTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const { appointments, updateAppointmentStyle } = store;
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = appointments.filter(a => filterStatus === 'all' || a.status === filterStatus)
        .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'geplant': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'verschoben': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'abgesagt': return 'bg-red-100 text-red-800 border-red-200';
        case 'abgeschlossen': return 'bg-amber-100 text-amber-800 border-amber-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const cancelApp = (id: string) => {
      if(confirm("Diesen Termin wirklich absagen?")) {
          updateAppointmentStyle(id, { status: 'abgesagt', cancellationReason: 'Manuelle Absage UI' });
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Terminliste</h2>
           <p className="text-gray-500">Alle erfassten Termine im System.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            {['all', 'geplant', 'verschoben', 'abgesagt'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filterStatus === s ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {s === 'all' ? 'Alle' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
               <tr>
                   <th className="px-6 py-4">Kunde</th>
                   <th className="px-6 py-4">Datum & Zeit</th>
                   <th className="px-6 py-4">Leistung</th>
                   <th className="px-6 py-4">Mitarbeiter</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Aktionen</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {filtered.length === 0 ? (
                   <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Keine Termine gefunden.</td></tr>
               ) : filtered.map(app => (
                   <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4">
                           <div className="font-semibold text-gray-900">{app.customerName}</div>
                           <div className="text-xs text-gray-500">{app.phone}</div>
                       </td>
                       <td className="px-6 py-4">
                           <div className="text-gray-900">{format(parseISO(app.date), 'dd. MMM yyyy', {locale: de})}</div>
                           <div className="text-xs text-gray-500">{app.startTime} - {app.endTime}</div>
                       </td>
                       <td className="px-6 py-4 text-gray-700">{app.service}</td>
                       <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">{app.staff}</span>
                       </td>
                       <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                               {app.status.toUpperCase()}
                           </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                           {app.status === 'geplant' && (
                               <button 
                                onClick={() => cancelApp(app.id)}
                                className="text-red-500 hover:text-red-700 font-medium text-xs transition-colors">
                                   Absagen
                               </button>
                           )}
                       </td>
                   </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
