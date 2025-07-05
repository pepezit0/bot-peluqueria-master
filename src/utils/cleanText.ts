/**
 * Borra comillas desparejadas, espacios duplicados y emojis sueltos.
 */
export const cleanText = (txt: string) =>
  txt
    // quita comillas de inicio / fin
    .replace(/^["'“”]|["'“”]$/g, '')
    // borra emojis sueltos de una sola palabra
    .replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/gu, '')
    // normaliza espacios
    .replace(/\s{2,}/g, ' ')
    .trim();
