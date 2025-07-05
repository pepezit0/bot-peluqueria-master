import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { clearHistory } from "../utils/handleHistory";
import { flowSchedule } from "./schedule.flow";
import { appToCalendar } from "../services/calendar";

const flowCancel = addKeyword(EVENTS.ACTION)
  .addAction(async (_, { flowDynamic }) => {
    await flowDynamic(
      "De acuerdo, vamos a cancelar o mover su cita.\nIndíqueme la fecha y hora de la cita que desea modificar:"
    );
  })
  .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    await state.update({ cancelTarget: ctx.body });
    await flowDynamic("¿Quiere programar una nueva fecha ahora mismo? (sí/no)");
  })
  .addAction({ capture: true }, async (ctx, { state, gotoFlow, flowDynamic }) => {
    // cancela en tu sistema externo
    await appToCalendar(JSON.stringify({ cancel: state.get("cancelTarget") }));

    if (/^s[ií]/i.test(ctx.body)) {
      await clearHistory(state);
      return gotoFlow(flowSchedule);
    }
    await flowDynamic("Cita cancelada. ¡Que tenga buen día!");
    await clearHistory(state);
  });

export { flowCancel };
