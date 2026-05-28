import React, { useState } from 'react';
import { useSalonStore } from '../store';
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function CalendarTab({ store }: { store: ReturnType<typeof useSalonStore> }) {
  const { appointments } = store;
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({length: 6}).map((_, i) => addDays(weekStart, i)); // Mo-Sa
  
  const hours = Array.from({length: 12}).map((_, i) => i + 9); // 9 to 20

  const getAppointmentsForDay = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return appointments.filter(a => a.date === dateStr && a.status !== 'abgesagt');
  }

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Demo-Kalender</h2>
           <p className="text-gray-500">Live-Anzeige der gebuchten Termine.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Heute</button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={prevWeek} className="px-3 py-2 hover:bg-gray-50 transition-colors border-r border-gray-200 text-gray-600">◀</button>
                <div className="px-4 py-2 text-sm font-medium min-w-[140px] text-center">
                    {format(weekStart, 'dd. MMM', {locale: de})} - {format(addDays(weekStart, 5), 'dd. MMM', {locale: de})}
                </div>
                <button onClick={nextWeek} className="px-3 py-2 hover:bg-gray-50 transition-colors border-l border-gray-200 text-gray-600">▶</button>
            </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
         {/* Head */}
         <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 flex-shrink-0">
             <div className="p-4 border-r border-gray-200 text-center text-xs font-semibold text-gray-400">ZEIT</div>
             {weekDays.map(day => (
                 <div key={day.toString()} className={`p-4 text-center border-r border-gray-200 ${isSameDay(day, new Date()) ? 'bg-black text-white' : ''}`}>
                     <div className={`text-xs font-medium uppercase ${isSameDay(day, new Date()) ? 'text-gray-300' : 'text-gray-500'}`}>{format(day, 'EEEE', {locale: de})}</div>
                     <div className="font-bold text-lg">{format(day, 'dd', {locale: de})}</div>
                 </div>
             ))}
         </div>
         {/* Body */}
         <div className="flex-1 overflow-y-auto relative">
             <div className="grid grid-cols-7 min-w-[800px]">
                 <div className="border-r border-gray-200 flex flex-col">
                     {hours.map(h => (
                         <div key={h} className="h-20 border-b border-gray-100 text-right pr-4 pt-2 text-xs text-gray-400 font-medium">
                             {h}:00
                         </div>
                     ))}
                 </div>
                 {weekDays.map((day, dayIdx) => (
                     <div key={'col'+dayIdx} className="border-r border-gray-200 relative">
                         {hours.map(h => (
                             <div key={h} className="h-20 border-b border-gray-50"></div>
                         ))}
                         {/* Render Appointments */}
                         {getAppointmentsForDay(day).map(app => {
                             const [h, m] = app.startTime.split(':').map(Number);
                             const startTop = ((h - 9) * 80) + (m / 60 * 80);
                             const height = (app.durationMinutes / 60) * 80;
                             
                             return (
                                 <div 
                                    key={app.id} 
                                    className={`absolute left-1 right-1 rounded-md p-2 shadow-sm border overflow-hidden text-xs transition-transform hover:scale-[1.02] ${app.status === 'geplant' ? 'bg-emerald-50 border-emerald-200 z-10' : 'bg-blue-50 border-blue-200 z-0'}`}
                                    style={{ top: `${startTop}px`, height: `${height}px` }}
                                 >
                                     <div className="font-bold text-gray-900 truncate">{app.customerName}</div>
                                     <div className="text-gray-500 font-medium">{app.startTime} - {app.staff}</div>
                                     {height > 40 && <div className="text-emerald-700 mt-1 truncate opacity-80">{app.service}</div>}
                                 </div>
                             )
                         })}
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
