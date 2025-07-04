import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'

import AIClass from './services/ai'
import flows from './flows'

const ai = new AIClass(process.env.OPENAI_API_KEY, 'gpt-3.5-turbo-16k')

const main = async () => {
    const provider = createProvider(BaileysProvider)

    await createBot(
        {
            flow: flows, // ya está agrupado en tu archivo `flows/index.ts`
            database: new MemoryDB(),
            provider
        },
        {
            extensions: { ai }
        }
    )
}

main()
