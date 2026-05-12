/**
 * DuokeModule - Module for auto-replying messages in Duoke Chat
 */

import { Page } from 'playwright';
import { BaseModule } from '../../core/BaseModule.js';
import { ModuleDependencies } from '../../types/module.type.js';
import { ModuleConfig } from '../../types/config.type.js';
import { DuokeConfig, DuokeHistory } from './types.js';
import * as locators from './locators.js';
import { resolve } from 'node:path';
import { getProjectRoot } from '../../utils/path.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const CHAT_URL = 'https://web.duoke.com/?lang=en#/dk/main/chat';
const DEFAULT_CHECK_INTERVAL = 30000;

export class DuokeModule extends BaseModule {
    private duokeConfig: DuokeConfig;
    private loopPage: Page | null = null;
    private historyPath: string;
    private loopCount: number = 0; // Tambahkan counter untuk refresh

    constructor(deps: ModuleDependencies, instanceId: string, config: ModuleConfig) {
        super(deps, instanceId, config);
        this.duokeConfig = config as unknown as DuokeConfig;
        this.historyPath = resolve(getProjectRoot(), 'storage', `duoke_history_${this.instanceId}.json`);
    }

    async setupSchema(): Promise<void> {
        // No specific DB tables needed, using JSON as requested or KV store
        this.logger.info('DuokeModule schema setup skipped (using JSON storage)');
    }

    async init(): Promise<void> {
        this.setRunning(true);
        this.logger.info('DuokeModule initialized');
    }

    async stop(): Promise<void> {
        await this.cleanup();
        this.loopPage = null;
        this.logger.info('DuokeModule stopped');
    }

    /**
     * Main loop called by TaskManager
     */
    async executeLoop(): Promise<void> {
        try {
            const context = await this.getOrCreateContext('duoke_session', { blockAssets: false });
            
            if (!this.loopPage || this.loopPage.isClosed()) {
                this.loopPage = await context.newPage();
            }

            if (this.loopPage.url() === 'about:blank' || !this.loopPage.url().includes('duoke.com')) {
                await this.loopPage.goto(CHAT_URL);
                await this.sleep(5000);
            }

            // Auto Refresh setiap 300 putaran (Sekitar 10 menit jika loop 2 detik)
            this.loopCount++;
            if (this.loopCount >= 300) {
                this.logger.info('Refreshing Duoke page to keep connection fresh...');
                await this.loopPage.reload();
                await this.sleep(8000); // Tunggu loading setelah reload lebih lama sedikit agar stabil
                this.loopCount = 0;
            }

            // 1. Check Login
            const isLoginPage = await this.checkIsLoginPage();
            if (isLoginPage) {
                this.logger.warn('⚠️ Belum Login Duoke. Silahkan login manual di browser bot!', {
                    instanceId: this.instanceId
                });
                await this.sleep(60000); // Wait 1 minute before checking again
                return;
            }

            // 2. Auto-save session once logged in
            await this.saveSession('duoke_session');

            // 3. Scan for unread messages
            await this.scanAndReply();

        } catch (error) {
            this.logger.error(`Error in Duoke loop: ${error instanceof Error ? error.message : String(error)}`);
            await this.sleep(5000);
        }
    }

    private async checkIsLoginPage(): Promise<boolean> {
        if (!this.loopPage) return false;
        try {
            // Check for email input or login button
            const loginVisible = await locators.getEmailInput(this.loopPage).isVisible({ timeout: 2000 });
            return loginVisible;
        } catch {
            return false;
        }
    }

    private async scanAndReply(): Promise<void> {
        if (!this.loopPage) return;

        // Ambil daftar user yang sudah dibalas hari ini dari DB
        const repliedUsers = this.getRepliedUsers();

        // Cari semua kontainer chat yang punya badge unread DAN nama pembeli
        const chatItems = await locators.getChatItem(this.loopPage).all();
        
        if (chatItems.length === 0) {
            this.logger.debug('No valid unread chats found');
            return;
        }

        // Kumpulkan user unik untuk diproses agar tidak log dobel
        const uniqueUsersToProcess: Map<string, typeof chatItems[0]> = new Map();
        
        for (const item of chatItems) {
            try {
                const buyerElement = item.locator('div.buyer_name').first();
                if (!await buyerElement.isVisible()) continue;
                
                const username = (await buyerElement.innerText()).trim().toLowerCase();
                if (username && !uniqueUsersToProcess.has(username)) {
                    uniqueUsersToProcess.set(username, item);
                }
            } catch (err) {
                // Ignore silent error during collection
            }
        }

        // Proses setiap user unik
        for (const [username, item] of uniqueUsersToProcess.entries()) {
            try {
                // Cek apakah sudah dibalas hari ini
                if (repliedUsers.includes(username)) {
                    this.logger.info(`Skipping ${username}: already replied today`);
                    continue;
                }

                // Double check spesifik ke badge sup
                const badge = item.locator('sup.el-badge__content.is-fixed:visible').first();
                if (!await badge.isVisible()) continue;
 
                 this.logger.info(`Processing unread message from: ${username}`);
 
                 // Klik LANGSUNG pada nama pembeli
                 await item.locator('div.buyer_name').first().click({ force: true });
                 // Removed 3s sleep to be more responsive

                const textarea = locators.getChatTextarea(this.loopPage);
                try {
                    await textarea.waitFor({ state: 'visible', timeout: 8000 });
                } catch (e) {
                    this.logger.warn(`Textarea still not visible for ${username}, moving to next`);
                    continue;
                }

                if (await textarea.isVisible()) {
                    const replyLines = (process.env.REPLY_LINES || this.duokeConfig.reply_lines || 'Ready kak Silahkan Order')
                        .split('||')
                        .map(s => s.trim());

                    for (const line of replyLines) {
                        await textarea.fill(line);
                        await this.loopPage.keyboard.press('Enter');
                        await this.sleep(500); // Reduced from 1000ms
                    }

                    try {
                        this.saveRepliedUser(username);
                        repliedUsers.push(username); 
                        this.logger.info(`Successfully replied to ${username}`);
                    } catch (dbError) {
                        this.logger.error(`Failed to save history for ${username}: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
                    }
                    
                    // Removed 3s sleep to be more responsive
                }

            } catch (error) {
                this.logger.error(`Failed to process ${username}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    private getRepliedUsers(): string[] {
        const key = `duoke_replied_${this.instanceId}`;
        try {
            const row = this.db.get<{ value: string }>('SELECT value FROM sys_kv_store WHERE key = ?', [key]);
            if (!row) return [];
            
            const data = JSON.parse(row.value);
            const today = new Date().toISOString().split('T')[0];
            
            if (data.date !== today) return [];
            return data.users || [];
        } catch (error) {
            this.logger.error(`Error reading replied users from DB: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    private saveRepliedUser(username: string): void {
        const key = `duoke_replied_${this.instanceId}`;
        const users = this.getRepliedUsers();
        
        if (!users.includes(username)) {
            users.push(username);
        }

        const today = new Date().toISOString().split('T')[0];
        const data = JSON.stringify({
            date: today,
            users: users
        });

        // FIX: Gunakan datetime('now') dengan single quotes untuk SQLite
        this.db.run(
            'INSERT INTO sys_kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = datetime(\'now\')',
            [key, data]
        );
    }
}
