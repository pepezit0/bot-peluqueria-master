import { format, addMinutes, parseISO, isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const GET_CALENDAR_URL    = 'https://hook.eu2.make.com/62jkeuk5rmrkvalobpv1xg6hbovc9m6l';
const APP_TO_CALENDAR_URL = 'https://hook.eu2.make.com/a4zzuk8ap91ff6xwosabex59plld2agp';

interface CalendarEntry {
  date: string | number | Date;
  [key: string]: unknown;
}

/*───────────────────────────
  1) CONSULTAR AGENDA
───────────────────────────*/
const getCurrentCalendar = async (): Promise<string> => {
  try {
    const res  = await fetch(GET_CALENDAR_URL);
    const json = (await res.json()) as CalendarEntry[];

    const list = json.reduce<string>((prev, current) => {
      const startUTC = typeof current.date === 'string'
        ? parseISO(String(current.date).replace(/["']/g, '').trim())
        : new Date(current.date);

      if (!isValid(startUTC)) {
        console.warn('[Agenda] Fecha inválida recibida:', current.date);
        return prev;
      }

      // UTC → hora local (Madrid)
      const startLocal = toZonedTime(startUTC, 'Europe/Madrid'); // ← CAMBIA
      const endLocal   = addMinutes(startLocal, 45);

      return (
        prev +
        `Espacio reservado (no disponible):
Desde ${format(startLocal, 'eeee dd LLL yyyy HH:mm')}
Hasta ${format(endLocal,   'eeee dd LLL yyyy HH:mm')}\n\n`
      );
    }, '');

    return list;
  } catch (error) {
    console.error('[Agenda] Error al obtener calendario:', error);
    return '';
  }
};

/*───────────────────────────
  2) ENVIAR NUEVO EVENTO
───────────────────────────*/
const appToCalendar = async (text: string) => {
  try {
    const payload = JSON.parse(text);

    if (payload.startDate) {
      const raw    = String(payload.startDate).replace(/["']/g, '').trim();
      const parsed = isValid(parseISO(raw)) ? parseISO(raw) : new Date(raw);

      if (!isValid(parsed)) {
        throw new Error(`startDate inválido recibido: ${payload.startDate}`);
      }

      const hourLocal = parsed.getHours();
      if (hourLocal < 9 || hourLocal >= 16) {
        throw new Error(
          `startDate fuera de horario de atención (recibido ${hourLocal}:00)`
        );
      }

      // Hora local (Madrid) → UTC
      payload.startDate = fromZonedTime(parsed, 'Europe/Madrid') // ← CAMBIA
        .toISOString();
    }

    const res = await fetch(APP_TO_CALENDAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res;
  } catch (error) {
    console.error('[Agenda] Error al enviar evento al calendario:', error);
  }
};

export { getCurrentCalendar, appToCalendar };
