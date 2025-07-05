import { BotContext, BotMethods } from "@bot-whatsapp/bot/dist/types";
import { handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";

/**
 * Su funcion es almancenar en el state todos los mensajes que el usuario  escriba
 */
export default async ({ body }: BotContext, { state, extensions, flowDynamic }: BotMethods) => {
    const ai = extensions.ai as AIClass;

    // ---------- Detector IA de lenguaje ofensivo ----------
    const checkPrompt = `
Eres un detector de lenguaje ofensivo.
Texto del usuario:
"${body}"

Responde SOLO con:
- OFENSIVO
- SEGURO
`.trim();

    const verdict = await ai.createChat(
        [{ role: "system", content: checkPrompt }],
        undefined,
        0               // temperatura 0 → respuestas consistentes
    );

    if (verdict?.includes("OFENSIVO")) {
        // respuesta neutra y cortamos el flujo
        await flowDynamic("Entiendo su molestia; intentemos mantener un lenguaje respetuoso. ¿En qué puedo ayudarle?");
        return;
    }
    // -------------------------------------------------------

    await handleHistory({ content: body, role: 'user' }, state);
}