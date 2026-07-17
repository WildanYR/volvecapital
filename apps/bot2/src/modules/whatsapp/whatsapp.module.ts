import { BaseModule } from '../../core/BaseModule.js';
import type { ModuleDependencies } from '../../types/module.type.js';
import type { ModuleConfig } from '../../types/config.type.js';
import pkg from 'whatsapp-web.js';
import type { Client as ClientType } from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import * as qrcode from 'qrcode-terminal';
import * as path from 'path';
import { getDataRoot, getProjectRoot } from '../../utils/path.js';

import puppeteer from 'puppeteer';

export class WhatsappModule extends BaseModule {
    private waClient!: ClientType;
    private isReady: boolean = false;

    constructor(deps: ModuleDependencies, instanceId: string, config: ModuleConfig) {
        super(deps, instanceId, config);
    }

    private initializeEvents() {
        this.waClient.on('qr', (qr: string) => {
            this.logger.info('====================================================');
            this.logger.info('SCAN QR CODE INI DENGAN WHATSAPP ANDA:');
            
            // Generate HTML file
            const htmlPath = path.resolve(getProjectRoot(), 'whatsapp-qr.html');
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot QR Code</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        h2 { color: #075e54; margin-bottom: 10px; }
        p { color: #555; margin-bottom: 30px; }
        #qrcode img { margin: 0 auto; }
    </style>
</head>
<body>
    <div class="box">
        <h2>WhatsApp Bot Login</h2>
        <p>Buka WhatsApp di HP Anda > Perangkat Tertaut > Tautkan Perangkat<br>Lalu scan QR Code di bawah ini:</p>
        <div id="qrcode"></div>
    </div>
    <script>
        new QRCode(document.getElementById("qrcode"), {
            text: "${qr}",
            width: 300,
            height: 300
        });
    </script>
</body>
</html>`;
            require('fs').writeFileSync(htmlPath, htmlContent);
            this.logger.info('👉 BUKA FILE INI DI BROWSER ANDA UNTUK SCAN QR:');
            this.logger.info(`👉 file:///${htmlPath.replace(/\\/g, '/')}`);
            this.logger.info('====================================================');
            
            // Print raw string as fallback
            console.log('\nAtau copy text ini ke web pembuat QR:');
            console.log(qr, '\n');
        });

        this.waClient.on('ready', () => {
            this.isReady = true;
            this.logger.info('✅ WhatsApp Bot sudah SIAP dan terhubung!');
        });

        this.waClient.on('authenticated', () => {
            this.logger.info('✅ WhatsApp berhasil terotentikasi!');
        });

        this.waClient.on('auth_failure', (msg: string) => {
            this.logger.error(`❌ Otentikasi gagal: ${msg}`);
        });

        this.waClient.on('disconnected', (reason: string) => {
            this.isReady = false;
            this.logger.warn(`❌ WhatsApp terputus: ${reason}`);
        });
    }

    async setupSchema(): Promise<void> {
        // No specific DB schema needed for basic whatsapp sending
    }

    async init(): Promise<void> {
        this.logger.info('Initializing WhatsApp Module...');

        const sessionPath = path.join(getDataRoot(), 'session_data', 'whatsapp');
        const exePath = await puppeteer.executablePath();
        
        this.waClient = new Client({
            authStrategy: new LocalAuth({
                dataPath: sessionPath
            }),
            puppeteer: {
                executablePath: exePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        });

        this.initializeEvents();

        await this.waClient.initialize();
        this.setRunning(true);
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping WhatsApp Module...');
        if (this.waClient) {
            try {
                await this.waClient.destroy();
            } catch (error) {
                this.logger.error('Failed to destroy WhatsApp client', error as any);
            }
        }
        await this.cleanup();
    }

    /**
     * Send a WhatsApp message.
     * This will be exposed as a task method if called by the TaskManager.
     */
    async send_wa_message(task: any): Promise<void> {
        if (!this.isReady) {
            throw new Error('WhatsApp client is not ready yet');
        }

        const { phoneNumber, message } = task.payload as { phoneNumber: string, message: string };
        if (!phoneNumber || !message) {
            throw new Error('Missing phoneNumber or message in payload');
        }

        let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        }
        const formattedNumber = `${formattedPhone}@c.us`;
        try {
            await this.waClient.sendMessage(formattedNumber, message);
            this.logger.info(`Message successfully sent to ${phoneNumber}`);
        } catch (error) {
            this.logger.error(`Failed to send message to ${phoneNumber}`, error as any);
            throw error;
        }
    }
}
