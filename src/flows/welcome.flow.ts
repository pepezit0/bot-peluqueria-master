import { EVENTS, addKeyword } from "@bot-whatsapp/bot";

/**
 * Saluda una sola vez al entrar y pasa al mainLayer
 */
export default addKeyword(EVENTS.WELCOME).addAction(async (_, { flowDynamic, gotoFlow }) => {
    await flowDynamic("¡Hola! ¿En qué puedo ayudarle hoy?");
    // mainLayer decidirá la intención a partir de la siguiente entrada
});
