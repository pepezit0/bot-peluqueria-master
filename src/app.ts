import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'
import qrcode from 'qrcode-terminal'
import AIClass from './services/ai'
import flows from './flows'

if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY no está definida en el archivo .env')
    process.exit(1)
}

const ai = new AIClass(process.env.OPENAI_API_KEY, 'gpt-3.5-turbo-16k')

const main = async () => {
    console.log('Iniciando el bot de WhatsApp...')

    const provider = createProvider(BaileysProvider, {
        name: 'bot-session',
        printQRInTerminal: true,
        gifPlayback: false,
        usePairingCode: false,
    })

    const bot = await createBot(
        {
            flow: flows,
            database: new MemoryDB(),
            provider
        },
        {
            extensions: { ai }
        }
    )

    console.log('Bot iniciado correctamente. Escanea el QR para vincular tu WhatsApp.')
}

main().catch((error) => {
    console.error('Error al iniciar el bot:', error)
    process.exit(1)
})