import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'
import qrcode from 'qrcode-terminal'
import AIClass from './services/ai'
import flows from './flows'

// Verificar que la API key existe
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY no está definida en el archivo .env')
    process.exit(1)
}

const ai = new AIClass(process.env.OPENAI_API_KEY, 'gpt-3.5-turbo-16k')

const main = async () => {
    console.log('🤖 Iniciando el bot de WhatsApp...')
    
    const provider = createProvider(BaileysProvider, {
        name: 'bot-session',
        gifPlayback: false,
        usePairingCode: false
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

    console.log('🚀 Bot iniciado correctamente.')
    console.log('📱 El código QR debería aparecer en breve...')
    console.log('💡 Si no aparece, verifica tu conexión a internet')
}

main().catch((error) => {
    console.error('❌ Error al iniciar el bot:', error)
    process.exit(1)
})