import { BotState } from "@bot-whatsapp/bot/dist/types";

export const markCitaConfirmada = async (state: BotState) =>
  state.update({ citaConfirmada: true });

export const resetCitaConfirmada = async (state: BotState) =>
  state.update({ citaConfirmada: false });

export const isCitaConfirmada = (state: BotState) =>
  state.get<boolean>("citaConfirmada") ?? false;
