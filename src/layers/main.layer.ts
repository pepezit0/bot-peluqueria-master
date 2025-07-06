import { BotContext, BotMethods } from "@bot-whatsapp/bot/dist/types"
import { getHistoryParse } from "../utils/handleHistory"
import AIClass from "../services/ai"
import { flowSeller } from "../flows/seller.flow"
import { flowSchedule } from "../flows/schedule.flow"
import { flowConfirm } from "../flows/confirm.flow"
import { flowCancel } from "../flows/cancel.flow";
import { isCitaConfirmada, resetCitaConfirmada } from "../utils/stateFlags";


/**
 * Decide qué flujo disparar a partir del contexto y el historial.
 */
export default async (
  ctx: BotContext,
  { state, gotoFlow, extensions }: BotMethods
) => {
  const ai = extensions.ai as AIClass;

  /*──────────────────── 1 · FILTRO DE DESPEDIDA CON IA ────────────────────*/
  if (isCitaConfirmada(state)) {
    const byePrompt = `
Eres un clasificador de intenciones para mensajes de WhatsApp.
Etiqueta el siguiente mensaje SOLO con una palabra:
- DESPEDIDA  → si es un adiós breve (vale, ok, gracias, perfecto, 👍, etc.)
- CONTINUAR  → si pide modificar/cancelar la cita o plantea otra cuestión.

Mensaje: «${ctx.body}»
`.trim();

    const label = await ai.createChat(
      [{ role: "system", content: byePrompt }],
      undefined,
      0
    );

    if (label?.includes("DESPEDIDA")) {
      await resetCitaConfirmada(state); // resetea la bandera de cita cerrada
      return;                           // no responde al cliente
    }
    // Si devuelve CONTINUAR, seguimos al clasificador principal ↓
  }
  /*────────────────────────────────────────────────────────────────────────*/

  /*──────────────────── 2 · CLASIFICADOR PRINCIPAL ───────────────────────*/
  const history = getHistoryParse(state);

  const prompt = `Como una inteligencia artificial avanzada, tu tarea es analizar el contexto de una conversación y determinar cuál de las siguientes acciones es más apropiada para realizar:
--------------------------------------------------------
Historial de conversación:
${history}

Posibles acciones a realizar:
1. AGENDAR  – El cliente quiere programar o re-programar una cita.
2. HABLAR   – El cliente solo hace consultas.
3. CONFIRMAR – Ya hay fecha exacta y solo falta confirmar datos.
4. CANCELAR – El cliente desea cancelar o mover su cita actual.

Tu objetivo es comprender la intención del cliente y seleccionar la acción más adecuada en respuesta a su declaración.

IMPORTANTE: Si el cliente menciona palabras como "cita", "cortar", "agenda" o "quiero cita", incluso si también saluda o pregunta cómo estás, la acción correcta es AGENDAR.

Tu respuesta DEBE ser exactamente una de estas palabras:
AGENDAR | HABLAR | CONFIRMAR | CANCELAR
----------------------------------------------------------------
Respuesta ideal:`; // ← sin paréntesis; la IA deberá responder solo la etiqueta

  const label = await ai.createChat([
    { role: "system", content: prompt },
  ]);

  if (label?.includes("HABLAR"))    return gotoFlow(flowSeller);
  if (label?.includes("AGENDAR"))   return gotoFlow(flowSchedule);
  if (label?.includes("CONFIRMAR")) return gotoFlow(flowConfirm);
  if (label?.includes("CANCELAR"))  return gotoFlow(flowCancel);
};