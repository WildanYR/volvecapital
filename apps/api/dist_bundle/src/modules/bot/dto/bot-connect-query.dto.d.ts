import { BotStatus } from '../types/bot.type';
export declare class BotConnectQueryDto {
    id: string;
    name: string;
    modifier: string;
    tenant_id: string;
    status?: BotStatus;
}
