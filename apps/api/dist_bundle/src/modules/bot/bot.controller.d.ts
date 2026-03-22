import { AppRequest } from 'src/types/app-request.type';
import { BotConnectionGateway } from './bot-connection.gateway';
export declare class BotController {
    private readonly botConnectionGateway;
    constructor(botConnectionGateway: BotConnectionGateway);
    getBotList(request: AppRequest): {
        id: string;
        bot_id: string;
        name: string;
        type: string;
        status: import("./types/bot-connection.type").BotStatus;
    }[];
    sendShutdownCommand(socketId: string): void;
}
