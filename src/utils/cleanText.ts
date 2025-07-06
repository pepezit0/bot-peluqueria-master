/**
 * Borra comillas desparejadas, espacios duplicados y emojis sueltos.
 */
export const cleanText = (txt: string) =>
  txt
    .replace(/^["'“”]|["'“”]$/g, '')
    .replace(/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/gu, '')
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

