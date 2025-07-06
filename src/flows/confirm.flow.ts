import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { clearHistory, handleHistory, getHistoryParse } from "../utils/handleHistory";
import { getFullCurrentDate } from "../utils/currentDate";
import { appToCalendar } from "../services/calendar";
import { cleanText } from "../utils/cleanText";
import { flowSchedule } from "../flows/schedule.flow";
import { markCitaConfirmada } from "../utils/stateFlags";


const generatePromptToFormatDate = (history: string) => {
    const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    ...dd / mm hh:mm`

    return prompt
}

const generateJsonParse = (info: string) => {
    const prompt = `tu tarea principal es analizar la información proporcionada en el contexto y generar un objeto JSON que se adhiera a la estructura especificada a continuación. 

    Contexto: "${info}"
    
    {
        "name": "Leifer",
        "startDate": "2024/02/15 00:00:00"
    }
    
    Objeto JSON a generar:`

    return prompt
}


/**
 * Devuelve "ACEPTA" si el cliente confirma la fecha/hora
 * o "REAGENDAR" si desea cambiarla o cancelarla.
 */
const makeCheckDatePrompt = (msg: string) => `
Eres un asistente virtual de una barbería.
El cliente ha respondido al horario propuesto con el siguiente texto:

"${msg}"

Responde ÚNICAMENTE con:
- ACEPTA …… si confirma la cita tal como está
- REAGENDAR … si quiere moverla, cancelarla o elegir otra hora
`.trim();


/**
 * Encargado de pedir los datos necesarios para registrar el evento en el calendario
 */
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Ok, voy a pedirte unos datos para agendar')
    await flowDynamic('¿Cual es tu nombre?')
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, extensions }) => {
    await state.update({ name: ctx.body })
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)
    const text = await ai.createChat([
        {
            role: 'system',
            content: generatePromptToFormatDate(history)
        }
    ], 'gpt-4')

    if (text) {
        const clean = cleanText(text);
        await handleHistory({ content: clean, role: 'assistant' }, state);
        await flowDynamic(`¿Me confirma fecha y hora?: ${clean}`);
        await state.update({ startDate: clean });
    }
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, gotoFlow, extensions }) => {
        const ai = extensions.ai as AIClass;

        // --- Llamamos a OpenAI para saber si acepta o quiere otra hora
        const intent = await ai.createChat([
            { role: 'system', content: makeCheckDatePrompt(ctx.body) }
        ]);

        if (intent?.includes('REAGENDAR')) {
            await flowDynamic('Entendido, revisemos otro horario.');   // respuesta opcional
            return gotoFlow(flowSchedule);                             // ← vuelve al flujo de agenda
        }

        // Si el cliente acepta, seguimos con el flujo normal:
        await flowDynamic('Última pregunta, ¿cuál es su email?');
    })

    .addAction({ capture: true }, async (ctx, { state, extensions, flowDynamic }) => {
        const infoCustomer = `Name: ${state.get('name')}, StarteDate: ${state.get('startDate')}, email: ${ctx.body}`
        const ai = extensions.ai as AIClass

        const text = await ai.createChat([
            {
                role: 'system',
                content: generateJsonParse(infoCustomer)
            }
        ])

        if (text) {
            const clean = cleanText(text);
            await appToCalendar(clean);
            clearHistory(state);
            await markCitaConfirmada(state)
            await flowDynamic('Listo! agendado Buen dia');
        }
    })

export { flowConfirm }