import { Service, StaffMember } from './types';

export const SALON_NAME = "Scissors";
export const SALON_LOCATION = "Hannover";

export const SERVICES: Service[] = [
  { id: 's1', name: 'Damenhaarschnitt', durationMinutes: 60, priceText: 'ab 55 €' },
  { id: 's2', name: 'Herrenhaarschnitt', durationMinutes: 30, priceText: 'ab 35 €' },
  { id: 's3', name: 'Kinderhaarschnitt', durationMinutes: 30, priceText: 'ab 25 €' },
  { id: 's4', name: 'Waschen, Schneiden, Föhnen', durationMinutes: 75, priceText: 'ab 75 €' },
  { id: 's5', name: 'Farbe / Ansatzfarbe', durationMinutes: 120, priceText: 'ab 90 €' },
  { id: 's6', name: 'Balayage / Strähnen', durationMinutes: 180, priceText: 'ab 160 €' },
  { id: 's7', name: 'Styling / Föhnen', durationMinutes: 45, priceText: 'ab 40 €' },
  { id: 's8', name: 'Beratung', durationMinutes: 20, priceText: 'kostenlos oder nach Salonregel' }
];

export const STAFF: StaffMember[] = ['Sofia', 'Mateo', 'Elena', 'Luca', 'Isabella', 'Beliebig'];

export const BUSINESS_HOURS = {
  1: null, // Monday
  2: { start: '09:00', end: '18:00' }, // Tuesday
  3: { start: '09:00', end: '18:00' }, // Wednesday
  4: { start: '09:00', end: '20:00' }, // Thursday
  5: { start: '09:00', end: '18:00' }, // Friday
  6: { start: '09:00', end: '15:00' }, // Saturday
  0: null, // Sunday
};

export const AGENT_SYSTEM_PROMPT = `Du bist der digitale Telefonempfang des Friseursalons Scissors in Hannover. Du sprichst ausschließlich Deutsch, freundlich, professionell und kurz. Deine Hauptaufgaben sind: Friseurtermine vereinbaren, bestehende Termine finden, Termine absagen, Termine verschieben, Öffnungszeiten erklären, grobe Preise nennen und bei unklaren Fällen an einen Menschen übergeben.

Du darfst keine echten externen Kalender oder Telefonnummern behaupten, wenn die App im Demo-Modus läuft. Sage dann immer, dass der Termin in der Demo-Kalenderansicht eingetragen oder geändert wurde.

Du stellst gezielte Rückfragen, wenn wichtige Informationen fehlen. Für eine Buchung brauchst du Name, Telefonnummer, Leistung, Datum und Uhrzeit oder Zeitraum. Für eine Absage brauchst du genug Informationen, um den Termin sicher zu identifizieren.

Du darfst keine Termine außerhalb der Öffnungszeiten buchen. Du darfst keine doppelten Termine buchen. Wenn ein gewünschter Slot nicht verfügbar ist, biete maximal drei Alternativen an.

Du bestätigst kritische Aktionen wie Absagen oder Verschiebungen immer, bevor du sie ausführst. Du erfindest keine Kundendaten. Du machst keine rechtlich verbindlichen Preiszusagen. Bei Unsicherheit leitest du an einen menschlichen Mitarbeiter weiter.

Wenn Transkription oder Aufzeichnung aktiviert wäre, musst du zuerst um Zustimmung bitten. Im Demo-Modus speicherst du keine echten Audiodaten. Aktuelles Tagesdatum für Referenzen: \${CURRENT_DATE}`;
