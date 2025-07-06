import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "../services/calendar";
import { getFullCurrentDate } from "../utils/currentDate";
import { cleanText } from "../utils/cleanText";

const PROMPT_SCHEDULE = `
Como ingeniero de inteligencia artificial especializado en la programación de reuniones, tu objetivo es analizar la conversación y determinar la intención del cliente de programar una reunión, así como su preferencia de fecha y hora. La reunión durará aproximadamente 45 minutos y solo puede ser programada de lunes a viernes, de 10:00 a 13:30 y de 16:30 a 19:30 (formato 24 h).

Fecha de hoy: {CURRENT_DAY}

Reuniones ya agendadas:
-----------------------------------
{AGENDA_ACTUAL}

Historial de Conversacion:
-----------------------------------
{HISTORIAL_CONVERSACION}

Ejemplos de respuestas adecuadas para sugerir horarios y verificar disponibilidad:
----------------------------------
"Por supuesto, tengo un espacio disponible mañana, ¿a qué hora te resulta más conveniente?"
"Sí, tengo un espacio disponible hoy, ¿a qué hora te resulta más conveniente?"
"Ciertamente, tengo varios huecos libres esta semana. Por favor, indícame el día y la hora que prefieres."

INSTRUCCIONES:
- Si existe disponibilidad debes decirle al usuario que confirme
- Revisar detalladamente el historial de conversación y calcular el día fecha y hora que no tenga conflicto con otra hora ya agendada
- NO uses emojis
- Respuestas cortas ideales para enviar por whatsapp
- Mantén un tono formal y profesional
- No copies muletillas o jerga del cliente (bro, tío, etc.)
- No encierres tu respuesta entre comillas

REGLAS ADICIONALES:
- Usa SIEMPRE el formato 24 h (ej.: 15:30).
- Si el cliente da solo un número (ej. “5” u “11”), interpreta:
  • Si 05:00 está fuera y 17:00 dentro → asume 17:00.
  • Si 05:00 dentro y 17:00 fuera → asume 05:00.
  • Si ambos dentro o ambos fuera → pide aclaración (mañana/tarde) ANTES de sugerir.

-----------------------------
Respuesta útil en primera persona:`

const generateSchedulePrompt = (summary: string, history: string) => {
    const nowDate = getFullCurrentDate()
    const mainPrompt = PROMPT_SCHEDULE
        .replace('{AGENDA_ACTUAL}', summary)
        .replace('{HISTORIAL_CONVERSACION}', history)
        .replace('{CURRENT_DAY}', nowDate)

    return mainPrompt
}

/**
 * Hable sobre todo lo referente a agendar citas, revisar historial saber si existe huecos disponibles
 */
const flowSchedule = addKeyword(EVENTS.ACTION).addAction(async (ctx, { extensions, state, flowDynamic }) => {
    // No enviamos mensaje de “pensando…”
  
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)
    const list = await getCurrentCalendar()
    const promptSchedule = generateSchedulePrompt(list?.length ? list : 'ninguna', history)

    const text = await ai.createChat([
        {
            role: 'system',
            content: promptSchedule
        },
        {
            role: 'user',
            content: `Cliente pregunta: ${ctx.body}`
        }
    ], 'gpt-4')

    if (text) {
        const clean = cleanText(text);
        await handleHistory({ content: clean, role: 'assistant' }, state);

        const chunks = clean.split(/(?<!\d)\.\s+/g);
        for (const chunk of chunks) {
            await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
        }
    }
})

export { flowSchedule }