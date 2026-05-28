import { useSalonStore } from "../store";
import { formatTimeSlot, addDays } from "./utils";

// Minimaler, lokaler Fake-Agent falls der GEMINI_API_KEY fehlt.
// Eine extrem simple regelbasierte Logik für Demo-Zwecke.

let conversationState: 'START' | 'ASK_NAME' | 'ASK_SERVICE' | 'CONFIRM_BOOKING' | 'CONFIRM_CANCEL' = 'START';
let tempBookingData: any = {};

export function handleDemoAgentTurn(input: string, store: ReturnType<typeof useSalonStore>): string {
    const text = input.toLowerCase();
    
    if (text.includes("absagen") || text.includes("stornieren")) {
        conversationState = 'CONFIRM_CANCEL';
        return "Gerne, ich helfe Ihnen beim Absagen. Wie lautet Ihr Name?";
    }

    if (text.includes("termin") || text.includes("buchen") || text.includes("schneiden")) {
        conversationState = 'ASK_SERVICE';
        return "Das mache ich gerne. Welche Leistung wünschen Sie? (z.B. Damenhaarschnitt, Herrenhaarschnitt)";
    }

    // State Machine
    if (conversationState === 'CONFIRM_CANCEL') {
        const found = store.appointments.find(a => a.customerName.toLowerCase().includes(text));
        if (found) {
            store.updateAppointmentStyle(found.id, { status: 'abgesagt' });
            conversationState = 'START';
            return `Alles klar, ich habe den Termin für ${found.customerName} am ${found.date} abgesagt.`;
        } else {
            return "Ich konnte unter diesem Namen leider keinen Termin finden. Bitte prüfen Sie den Namen noch einmal.";
        }
    }

    if (conversationState === 'ASK_SERVICE') {
        tempBookingData.service = input;
        conversationState = 'ASK_NAME';
        return "Notiert. Auf welchen Namen soll ich den Termin eintragen?";
    }

    if (conversationState === 'ASK_NAME') {
        tempBookingData.name = input;
        tempBookingData.date = addDays(new Date().toISOString().split('T')[0], 1);
        tempBookingData.time = "14:00";
        conversationState = 'CONFIRM_BOOKING';
        return `Danke ${input}. Ich hätte morgen um 14:00 Uhr noch frei. Möchten Sie diesen Termin verbindlich buchen?`;
    }

    if (conversationState === 'CONFIRM_BOOKING') {
        if (text.includes("ja") || text.includes("gerne") || text.includes("ok")) {
            store.addAppointment({
                type: 'appointment',
                source: 'voice-agent',
                customerName: tempBookingData.name || "Demo Kunde",
                phone: "0123 456789",
                service: tempBookingData.service || "Haarschnitt",
                date: tempBookingData.date,
                startTime: tempBookingData.time,
                staff: "Sofia",
                status: "geplant",
                notes: "Via Voice Demo gebucht"
                // endTime, createdAt, updatedAt are generated inside store
            } as any);
            conversationState = 'START';
            tempBookingData = {};
            return "Wunderbar, der Termin ist eingetragen. Sie sehen ihn jetzt im Menü unter 'Kalender'. Bis morgen!";
        } else {
            conversationState = 'START';
            tempBookingData = {};
            return "Okay, ich habe den Termin nicht gebucht. Wenn ich sonst noch helfen kann, sagen Sie gerne Bescheid.";
        }
    }

    if (text.includes("preis") || text.includes("kostet")) {
        return "Ein Damenhaarschnitt liegt bei ca. 55 €, ein Herrenhaarschnitt bei 35 €. Die genauen Preise hängen vom Aufwand ab.";
    }

    if (text.includes("öffnungszeiten") || text.includes("geöffnet")) {
        return "Wir haben von Dienstag bis Freitag von 9 bis 18 Uhr geöffnet, am Donnerstag sogar bis 20 Uhr. Montags ist geschlossen.";
    }

    return "Verzeihung, das habe ich nicht ganz verstanden. Möchten Sie einen Termin vereinbaren oder etwas anderes?";
}
