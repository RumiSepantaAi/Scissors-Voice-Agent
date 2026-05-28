import { useState, useEffect } from 'react';
import { Appointment, SalonConfig } from './types';
import { addDays, formatTimeSlot, generateId } from './lib/utils';
import { SERVICES } from './constants';

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: generateId(), type: 'appointment', source: 'manual-demo',
    customerName: 'Maria Keller', phone: '0511 111222',
    service: 'Waschen, Schneiden, Föhnen', staff: 'Sofia',
    date: addDays(new Date().toISOString().split('T')[0], 1),
    startTime: '10:00', endTime: formatTimeSlot('10:00', 75), durationMinutes: 75,
    status: 'geplant', notes: null, cancellationReason: null, previousAppointmentId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: generateId(), type: 'appointment', source: 'manual-demo',
    customerName: 'Jonas Richter', phone: '0511 333444',
    service: 'Herrenhaarschnitt', staff: 'Mateo',
    date: addDays(new Date().toISOString().split('T')[0], 1),
    startTime: '15:30', endTime: formatTimeSlot('15:30', 30), durationMinutes: 30,
    status: 'geplant', notes: null, cancellationReason: null, previousAppointmentId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    id: generateId(), type: 'appointment', source: 'manual-demo',
    customerName: 'Aylin Demir', phone: '0511 555666',
    service: 'Farbe / Ansatzfarbe', staff: 'Elena',
    date: addDays(new Date().toISOString().split('T')[0], 2),
    startTime: '11:00', endTime: formatTimeSlot('11:00', 120), durationMinutes: 120,
    status: 'geplant', notes: null, cancellationReason: null, previousAppointmentId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
];

export function useSalonStore() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [config, setConfig] = useState<SalonConfig>({
    name: "Scissors",
    location: "Hannover",
    demoMode: false,
    geminiModel: "gemini-3.5-flash",
    liveModel: "gemini-3.1-flash-live-preview"
  });

  useEffect(() => {
    const stored = localStorage.getItem('scissor_appointments');
    if (stored) {
      setAppointments(JSON.parse(stored));
    } else {
      setAppointments(DEMO_APPOINTMENTS);
      localStorage.setItem('scissor_appointments', JSON.stringify(DEMO_APPOINTMENTS));
    }

    const storedConf = localStorage.getItem('scissor_config');
    if (storedConf) setConfig(JSON.parse(storedConf));
  }, []);

  const saveAppointments = (newApps: Appointment[]) => {
    setAppointments(newApps);
    localStorage.setItem('scissor_appointments', JSON.stringify(newApps));
  };

  const addAppointment = (app: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'endTime'>) => {
    const serviceObj = SERVICES.find(s => s.name.toLowerCase() === app.service.toLowerCase()) || SERVICES[0];
    const newAppointment: Appointment = {
      ...app,
      id: generateId(),
      endTime: formatTimeSlot(app.startTime, app.durationMinutes || serviceObj.durationMinutes),
      durationMinutes: app.durationMinutes || serviceObj.durationMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveAppointments([...appointments, newAppointment]);
    return newAppointment;
  };

  const updateAppointmentStyle = (id: string, updates: Partial<Appointment>) => {
    const newApps = appointments.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a);
    saveAppointments(newApps);
    return newApps.find(a => a.id === id);
  };

  const resetDemoData = () => {
    saveAppointments(DEMO_APPOINTMENTS);
  };

  return { appointments, config, saveAppointments, addAppointment, updateAppointmentStyle, resetDemoData, setConfig: (c: SalonConfig) => { setConfig(c); localStorage.setItem('scissor_config', JSON.stringify(c)); } };
}
