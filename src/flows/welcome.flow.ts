import { EVENTS, addKeyword } from "@bot-whatsapp/bot";
import conversationalLayer from "../layers/conversational.layer";
import mainLayer from "../layers/main.layer";

/**
 * 1) Saluda una sola vez por sesión
 * 2) A partir de ahí encadena las capas de conversación y de decisión
 */
export default addKeyword(EVENTS.WELCOME)
  // Saludo (solo la primera vez)
  .addAction(async (_, { flowDynamic, state }) => {
    if (!state.get("greeted")) {
      await flowDynamic("¡Hola! ¿En qué puedo ayudarle hoy?");
      await state.update({ greeted: true });
    }
  })
  // Guarda el mensaje en historial
  .addAction(conversationalLayer)
  // Decide a qué flujo ir (AGENDAR | HABLAR | CONFIRMAR | CANCELAR)
  .addAction(mainLayer);
