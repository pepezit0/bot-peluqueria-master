import 'dotenv/config'
import { createBot, MemoryDB, createProvider } from '@bot-whatsapp/bot'
import { BaileysProvider } from '@bot-whatsapp/provider-baileys'
import qrcode from 'qrcode-terminal'
import AIClass from './services/ai'
import flows from './flows'

const ai = new AIClass(process.env.OPENAI_API_KEY, 'gpt-3.5-turbo-16k')

const main = async () => {
    console.log('🤖 Iniciando el bot de WhatsApp...')
    
    const provider = createProvider(BaileysProvider, {
        name: 'bot-session',
        gifPlayback: false,
        usePairingCode: false, // Forzar usar QR en lugar de código de emparejamiento
        phoneNumber: null
    })

    // Escuchar eventos del proveedor
    provider.on('ready', () => {
        console.log('✅ Bot listo y conectado!')
    })

    provider.on('auth_failure', (error) => {
        console.error('❌ Error de autenticación:', error)
    })

    provider.on('qr', (qr) => {
        console.log('📱 Código QR generado:')
        qrcode.generate(qr, { small: true })
    })

    await createBot(
        {
            flow: flows,
            database: new MemoryDB(),
            provider
        },
        {
            extensions: { ai }
        }
    )

    console.log('🚀 Bot iniciado correctamente. Esperando código QR...')
}

main().catch(console.error)